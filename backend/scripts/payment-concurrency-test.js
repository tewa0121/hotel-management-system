// Payment race check against your REAL running API and database.
//
//   1. start the backend  (npm run dev)
//   2. in another terminal:  node scripts/payment-concurrency-test.js
//
// It creates a test reservation (total 150.00, far in the future) and then:
//   A. sends 6 payments of 100.00 at the same moment  -> only ONE may be accepted
//      (the others would overpay), and the reservation must show exactly 100.00 paid
//   B. refunds that payment twice at the same moment   -> only ONE refund may go through
//   C. sends 2 payments of 75.00 at the same moment    -> both accepted, 150.00 paid,
//      nothing lost (the reservation must be "paid" with balance 0)
// Afterwards it refunds the test payments and cancels the reservation.
//
// Optional settings (environment variables):
//   API_URL        default http://localhost:5000/api
//   TEST_EMAIL     default admin@hotel.com
//   TEST_PASSWORD  default admin123

const API = process.env.API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.TEST_EMAIL || 'admin@hotel.com';
const PASSWORD = process.env.TEST_PASSWORD || 'admin123';

const pad = (n) => String(n).padStart(2, '0');
const dateInDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const request = async (method, path, token, body) => {
    const response = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        // response had no JSON body
    }
    return { status: response.status, data };
};

let failures = 0;
const check = (label, ok, details = '') => {
    if (!ok) failures++;
    console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${ok || !details ? '' : '  -> ' + details}`);
};

const main = async () => {
    console.log(`Testing ${API}\n`);

    // ---- log in, pick a room and a guest ----
    const login = await request('POST', '/auth/login', null, { email: EMAIL, password: PASSWORD });
    if (!login.data || !login.data.token) {
        console.log(`Could not log in as ${EMAIL} (status ${login.status}). Is the backend running?`);
        process.exit(1);
    }
    const token = login.data.token;

    const rooms = await request('GET', '/rooms', token);
    const room = (rooms.data?.data || []).find(r => r.status === 'available' && Number(r.max_occupancy) >= 1);
    const guests = await request('GET', '/guests?limit=1', token);
    const guest = (guests.data?.data || [])[0];
    if (!room || !guest) {
        console.log('Need at least one available room and one guest to run this test.');
        process.exit(1);
    }

    // ---- a test reservation worth 150.00 ----
    const offset = 600 + Math.floor(Math.random() * 300);
    const created = await request('POST', '/reservations', token, {
        guest_id: guest.id,
        room_id: room.id,
        check_in_date: dateInDays(offset),
        check_out_date: dateInDays(offset + 1),
        adults: 1,
        rate: 150,
        tax: 0,
        total_amount: 150,
        deposit_paid: 0
    });
    const reservationId = created.data?.data?.id;
    if (!reservationId) {
        console.log(`Could not create the test reservation: ${created.status} ${created.data?.message || ''}`);
        process.exit(1);
    }
    console.log(`Test reservation #${reservationId} (room ${room.room_number}, total 150.00)\n`);

    const getReservation = async () => (await request('GET', `/reservations/${reservationId}`, token)).data?.data;
    const payment = (amount) => ({
        reservation_id: reservationId,
        guest_id: guest.id,
        amount,
        payment_method: 'cash',
        status: 'completed'
    });
    const completedPaymentIds = [];

    // ---- A. six simultaneous payments of 100 (only one fits in 150) ----
    console.log('A. 6 payments of 100.00 at the same moment');
    const a = await Promise.all(Array.from({ length: 6 }, () => request('POST', '/payments', token, payment(100))));
    console.log(`   statuses: ${a.map(r => r.status).join(', ')}`);
    a.filter(r => r.status === 201).forEach(r => completedPaymentIds.push(r.data.data.id));
    const afterA = await getReservation();
    check('exactly one payment accepted', a.filter(r => r.status === 201).length === 1, `${a.filter(r => r.status === 201).length} accepted`);
    check('the others refused with 400 (would overpay)', a.filter(r => r.status === 400).length === 5);
    check('reservation shows exactly 100.00 paid, balance 50.00',
        Number(afterA?.deposit_paid) === 100 && Number(afterA?.balance) === 50,
        `deposit ${afterA?.deposit_paid}, balance ${afterA?.balance}`);

    // ---- B. the same payment refunded twice at the same moment ----
    console.log('\nB. the same payment refunded twice at the same moment');
    const firstPaymentId = completedPaymentIds[0];
    const b = await Promise.all([
        request('POST', `/payments/${firstPaymentId}/refund`, token, { reason: 'concurrency test' }),
        request('POST', `/payments/${firstPaymentId}/refund`, token, { reason: 'concurrency test' })
    ]);
    console.log(`   statuses: ${b.map(r => r.status).join(', ')}`);
    const afterB = await getReservation();
    check('exactly one refund went through', b.filter(r => r.status === 200).length === 1 && b.filter(r => r.status === 400).length === 1);
    check('reservation back to 0.00 paid (refunded once, not twice)',
        Number(afterB?.deposit_paid) === 0 && Number(afterB?.balance) === 150,
        `deposit ${afterB?.deposit_paid}, balance ${afterB?.balance}`);
    completedPaymentIds.length = 0;

    // ---- C. two simultaneous payments of 75 that exactly fill the 150 ----
    console.log('\nC. 2 payments of 75.00 at the same moment');
    const c = await Promise.all([
        request('POST', '/payments', token, payment(75)),
        request('POST', '/payments', token, payment(75))
    ]);
    console.log(`   statuses: ${c.map(r => r.status).join(', ')}`);
    c.filter(r => r.status === 201).forEach(r => completedPaymentIds.push(r.data.data.id));
    const afterC = await getReservation();
    check('both payments accepted', c.every(r => r.status === 201));
    check('reservation shows 150.00 paid, balance 0, status "paid" (no payment lost)',
        Number(afterC?.deposit_paid) === 150 && Number(afterC?.balance) === 0 && afterC?.payment_status === 'paid',
        `deposit ${afterC?.deposit_paid}, balance ${afterC?.balance}, ${afterC?.payment_status}`);

    // ---- clean up ----
    for (const id of completedPaymentIds) {
        await request('POST', `/payments/${id}/refund`, token, { reason: 'test cleanup' });
    }
    await request('POST', `/reservations/${reservationId}/cancel`, token);
    console.log('\nRefunded the test payments and cancelled the test reservation.');

    console.log(failures === 0 ? '\nAll checks passed: no payment is lost or counted twice.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
};

main().catch(error => {
    console.error('Test crashed:', error.message);
    process.exit(1);
});