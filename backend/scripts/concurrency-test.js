// Double-booking check against your REAL running API and database.
//
//   1. start the backend  (npm run dev)
//   2. in another terminal:  node scripts/concurrency-test.js
//
// It logs in, picks a room and a guest, then sends several booking requests for the
// SAME room and dates at the same moment. Exactly ONE must succeed (201); all the
// others must be refused (409). Afterwards it cancels the booking it made.
//
// Optional settings (environment variables):
//   API_URL        default http://localhost:5000/api
//   TEST_EMAIL     default admin@hotel.com
//   TEST_PASSWORD  default admin123
//   REQUESTS       how many simultaneous bookings, default 6

const API = process.env.API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.TEST_EMAIL || 'admin@hotel.com';
const PASSWORD = process.env.TEST_PASSWORD || 'admin123';
const REQUESTS = Number(process.env.REQUESTS) || 6;

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

    // ---- 1. log in ----
    const login = await request('POST', '/auth/login', null, { email: EMAIL, password: PASSWORD });
    if (!login.data || !login.data.token) {
        console.log(`Could not log in as ${EMAIL} (status ${login.status}). Is the backend running?`);
        process.exit(1);
    }
    const token = login.data.token;

    // ---- 2. pick a room and a guest ----
    const rooms = await request('GET', '/rooms', token);
    const room = (rooms.data?.data || []).find(r => r.status === 'available' && Number(r.max_occupancy) >= 1);
    const guests = await request('GET', '/guests?limit=1', token);
    const guest = (guests.data?.data || [])[0];

    if (!room || !guest) {
        console.log('Need at least one available room and one guest to run this test.');
        process.exit(1);
    }

    // Far in the future, so it cannot collide with real bookings
    const offset = 600 + Math.floor(Math.random() * 300);
    const checkIn = dateInDays(offset);
    const checkOut = dateInDays(offset + 2);
    console.log(`Room ${room.room_number}, guest #${guest.id}, ${checkIn} -> ${checkOut}`);
    console.log(`Sending ${REQUESTS} booking requests at the same moment...\n`);

    const booking = {
        guest_id: guest.id,
        room_id: room.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: 1,
        rate: 100,
        tax: 24,
        total_amount: 224,
        deposit_paid: 0
    };

    // ---- 3. simultaneous bookings ----
    const results = await Promise.all(
        Array.from({ length: REQUESTS }, () => request('POST', '/reservations', token, booking))
    );

    const created = results.filter(r => r.status === 201);
    const refused = results.filter(r => r.status === 409);
    console.log(`  statuses: ${results.map(r => r.status).join(', ')}\n`);

    check('exactly one booking was created', created.length === 1, `${created.length} were created`);
    check('every other request was refused with 409', refused.length === REQUESTS - 1,
        `${refused.length} refused, others: ${results.filter(r => ![201, 409].includes(r.status)).map(r => r.status + ' ' + (r.data?.message || '')).join('; ')}`);

    const reservationId = created[0]?.data?.data?.id;

    // ---- 4. an unpaid (pending) booking must block the room ----
    const search = await request('POST', '/reservations/available-rooms', token, {
        check_in_date: checkIn,
        check_out_date: checkOut
    });
    check('the room is no longer offered for those dates',
        search.status === 200 && !(search.data?.data || []).some(r => r.id === room.id));

    // ---- 5. back-to-back: arriving on the day the other guest leaves is allowed ----
    const backToBack = await request('POST', '/reservations', token, {
        ...booking,
        check_in_date: checkOut,
        check_out_date: dateInDays(offset + 4)
    });
    check('arriving the day the other guest leaves is allowed (201)', backToBack.status === 201,
        `${backToBack.status} ${backToBack.data?.message || ''}`);

    // ---- 6. clean up ----
    const toCancel = [reservationId, backToBack.data?.data?.id].filter(Boolean);
    for (const id of toCancel) {
        await request('POST', `/reservations/${id}/cancel`, token);
    }
    console.log(`\nCancelled ${toCancel.length} test booking(s).`);

    console.log(failures === 0 ? '\nAll checks passed: double booking is not possible.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
};

main().catch(error => {
    console.error('Test crashed:', error.message);
    process.exit(1);
});