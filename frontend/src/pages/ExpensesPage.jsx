/**
 * ExpensesPage - Hotel Expense Management
 * Allows staff to track, filter, and manage all hotel expenses.
 */
// import React, { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import {
//     FaPlus,
//     FaSearch,
//     FaMoneyBillWave,
//     FaTrash,
//     FaEdit
} from 'react-icons/fa';
import expenseService from '../services/expenseService';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [formData, setFormData] = useState({
        category: 'utilities',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        vendor: '',
        notes: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await expenseService.getExpenses();
            if (response.success) {
                setExpenses(response.data || []);
            }
        } catch (error) {
            toast.error('Failed to load expenses');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category || !formData.description || !formData.amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            if (editingExpense) {
                await expenseService.updateExpense(editingExpense.id, expenseData);
                toast.success('Expense updated successfully');
            } else {
                await expenseService.createExpense(expenseData);
                toast.success('Expense created successfully');
            }

            setShowForm(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
            toast.error(error.message || 'Failed to save expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await expenseService.deleteExpense(id);
            toast.success('Expense deleted successfully');
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            utilities: 'bg-blue-100 text-blue-800',
            salaries: 'bg-green-100 text-green-800',
            maintenance: 'bg-orange-100 text-orange-800',
            supplies: 'bg-purple-100 text-purple-800',
            cleaning: 'bg-indigo-100 text-indigo-800',
            food: 'bg-yellow-100 text-yellow-800',
            transportation: 'bg-cyan-100 text-cyan-800',
            marketing: 'bg-pink-100 text-pink-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    const getCategoryLabel = (category) => {
        const labels = {
            utilities: 'Utilities',
            salaries: 'Salaries',
            maintenance: 'Maintenance',
            supplies: 'Supplies',
            cleaning: 'Cleaning',
            food: 'Food & Beverage',
            transportation: 'Transportation',
            marketing: 'Marketing',
            other: 'Other'
        };
        return labels[category] || category;
    };

    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return num.toFixed(2);
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const thisMonthExpenses = expenses
        .filter(e => new Date(e.expense_date).getMonth() === new Date().getMonth())
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

    // Get unique categories for filter
    const categories = [...new Set(expenses.map(e => e.category))];

    // Filter expenses
    const filteredExpenses = expenses.filter(exp => {
        const matchSearch = exp.description?.toLowerCase().includes(search.toLowerCase()) ||
            exp.vendor?.toLowerCase().includes(search.toLowerCase());
        const matchCategory = filterCategory ? exp.category === filterCategory : true;
        return matchSearch && matchCategory;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-600 mt-1">Track hotel expenses and spending</p>
                </div>
                <button
                    onClick={() => {
                        setEditingExpense(null);
                        setFormData({
                            category: 'utilities',
                            description: '',
                            amount: '',
                            expense_date: new Date().toISOString().split('T')[0],
                            payment_method: 'cash',
                            vendor: '',
                            notes: ''
                        });
                        setShowForm(true);
                    }}
                    className="mt-3 sm:mt-0 btn-primary flex items-center"
                >
                    <FaPlus className="mr-2" />
                    Add Expense
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="card">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">${formatCurrency(totalExpenses)}</p>
                </div>
                <div className="card">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">${formatCurrency(thisMonthExpenses)}</p>
                </div>
                <div className="card">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
                </div>
                <div className="card">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-2xl font-bold text-green-600">${formatCurrency(averageExpense)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by description or vendor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={fetchExpenses} className="btn-secondary">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table View */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading expenses...</p>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="card text-center py-12">
                    <FaMoneyBillWave className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No expenses recorded</p>
                    <p className="text-gray-400 text-sm">Add your first expense</p>
                </div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment Method</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vendor</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Notes</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense) => (
                                <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-sm text-gray-500">{expense.id}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                                            {getCategoryLabel(expense.category)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-900">{expense.description}</td>
                                    <td className="py-3 px-4 text-right font-medium text-primary-600">
                                        ${formatCurrency(expense.amount)}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {new Date(expense.expense_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 capitalize text-sm">
                                        {expense.payment_method?.replace('_', ' ') || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{expense.vendor || '-'}</td>
                                    <td className="py-3 px-4 text-gray-500 text-sm max-w-xs truncate">
                                        {expense.notes || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingExpense(expense);
                                                    setFormData({
                                                        category: expense.category,
                                                        description: expense.description,
                                                        amount: expense.amount,
                                                        expense_date: expense.expense_date,
                                                        payment_method: expense.payment_method,
                                                        vendor: expense.vendor || '',
                                                        notes: expense.notes || ''
                                                    });
                                                    setShowForm(true);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <FaEdit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <FaTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Expense Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="utilities">Utilities</option>
                                    <option value="salaries">Salaries</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="supplies">Supplies</option>
                                    <option value="cleaning">Cleaning</option>
                                    <option value="food">Food & Beverage</option>
                                    <option value="transportation">Transportation</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field"
                                    placeholder="What was this expense for?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="input-field"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="check">Check</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                                <input
                                    type="text"
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    className="input-field"
                                    placeholder="Vendor name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    className="input-field"
                                    placeholder="Additional notes..."
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full">
                                {editingExpense ? 'Update Expense' : 'Create Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesPage;