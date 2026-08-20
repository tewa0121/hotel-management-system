// /**
//  * FoodMenuPage - Hotel Food & Beverage Menu Management
//  * Allows staff to manage food categories and menu items with availability.
//  */
// import React, { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import { FaPlus, FaEdit, FaTrash, FaSearch, FaUtensils, FaTags } from 'react-icons/fa';
// import foodService from '../services/foodService';

// const FoodMenuPage = () => {
//     const [categories, setCategories] = useState([]);
//     const [items, setItems] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [activeTab, setActiveTab] = useState('items');
//     const [showCategoryModal, setShowCategoryModal] = useState(false);
//     const [showItemModal, setShowItemModal] = useState(false);
//     const [editingCategory, setEditingCategory] = useState(null);
//     const [editingItem, setEditingItem] = useState(null);
//     const [categoryFilter, setCategoryFilter] = useState('');
//     const [searchTerm, setSearchTerm] = useState('');

//     // Category form state
//     const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
//     // Item form state
//     const [itemForm, setItemForm] = useState({
//         category_id: '',
//         name: '',
//         description: '',
//         price: '',
//         is_available: true,
//         image_url: ''
//     });

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             const [catRes, itemRes] = await Promise.all([
//                 foodService.getCategories(),
//                 foodService.getItems()
//             ]);
//             if (catRes.success) setCategories(catRes.data || []);
//             if (itemRes.success) setItems(itemRes.data || []);
//         } catch (error) {
//             toast.error('Failed to load menu data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Categories CRUD
//     const handleCategorySubmit = async (e) => {
//         e.preventDefault();
//         try {
//             if (editingCategory) {
//                 await foodService.updateCategory(editingCategory.id, categoryForm);
//                 toast.success('Category updated');
//             } else {
//                 await foodService.createCategory(categoryForm);
//                 toast.success('Category created');
//             }
//             setShowCategoryModal(false);
//             setEditingCategory(null);
//             setCategoryForm({ name: '', description: '' });
//             fetchData();
//         } catch (error) {
//             toast.error(error.message || 'Failed to save category');
//         }
//     };

//     const handleDeleteCategory = async (id) => {
//         if (!window.confirm('Delete this category?')) return;
//         try {
//             await foodService.deleteCategory(id);
//             toast.success('Category deleted');
//             fetchData();
//         } catch (error) {
//             toast.error('Failed to delete category');
//         }
//     };

//     // Items CRUD
//     const handleItemSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             if (editingItem) {
//                 await foodService.updateItem(editingItem.id, itemForm);
//                 toast.success('Item updated');
//             } else {
//                 await foodService.createItem(itemForm);
//                 toast.success('Item created');
//             }
//             setShowItemModal(false);
//             setEditingItem(null);
//             setItemForm({ category_id: '', name: '', description: '', price: '', is_available: true, image_url: '' });
//             fetchData();
//         } catch (error) {
//             toast.error(error.message || 'Failed to save item');
//         }
//     };

//     const handleDeleteItem = async (id) => {
//         if (!window.confirm('Delete this item?')) return;
//         try {
//             await foodService.deleteItem(id);
//             toast.success('Item deleted');
//             fetchData();
//         } catch (error) {
//             toast.error('Failed to delete item');
//         }
//     };

//     const filteredItems = items.filter(item => {
//         const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchCategory = categoryFilter ? item.category_id === parseInt(categoryFilter) : true;
//         return matchSearch && matchCategory;
//     });

//     if (loading) {
//         return <div className="text-center py-12">Loading menu...</div>;
//     }

//     return (
//         <div>
//             <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold text-gray-900">Food Menu</h1>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryModal(true); }}
//                         className="btn-secondary text-sm flex items-center gap-1"
//                     >
//                         <FaTags /> Add Category
//                     </button>
//                     <button
//                         onClick={() => { setEditingItem(null); setItemForm({ category_id: '', name: '', description: '', price: '', is_available: true, image_url: '' }); setShowItemModal(true); }}
//                         className="btn-primary text-sm flex items-center gap-1"
//                     >
//                         <FaPlus /> Add Item
//                     </button>
//                 </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex gap-2 mb-6 border-b border-gray-200">
//                 <button
//                     onClick={() => setActiveTab('items')}
//                     className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'items' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
//                 >
//                     <FaUtensils className="inline mr-2" /> Food Items
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('categories')}
//                     className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'categories' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
//                 >
//                     <FaTags className="inline mr-2" /> Categories
//                 </button>
//             </div>

//             {/* Categories Tab */}
//             {activeTab === 'categories' && (
//                 <div className="card">
//                     {categories.length === 0 ? (
//                         <p className="text-gray-500 text-center py-8">No categories yet. Add one!</p>
//                     ) : (
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {categories.map(cat => (
//                                 <div key={cat.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition">
//                                     <div>
//                                         <h3 className="font-semibold">{cat.name}</h3>
//                                         <p className="text-sm text-gray-500">{cat.description || 'No description'}</p>
//                                     </div>
//                                     <div className="flex gap-2">
//                                         <button
//                                             onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryModal(true); }}
//                                             className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
//                                         >
//                                             <FaEdit />
//                                         </button>
//                                         <button
//                                             onClick={() => handleDeleteCategory(cat.id)}
//                                             className="p-1.5 text-red-600 hover:bg-red-50 rounded"
//                                         >
//                                             <FaTrash />
//                                         </button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* Items Tab */}
//             {activeTab === 'items' && (
//                 <>
//                     {/* Filters */}
//                     <div className="card mb-6">
//                         <div className="flex flex-col sm:flex-row gap-4">
//                             <div className="flex-1 relative">
//                                 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                                 <input
//                                     type="text"
//                                     placeholder="Search items..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="input-field pl-10"
//                                 />
//                             </div>
//                             <div className="sm:w-48">
//                                 <select
//                                     value={categoryFilter}
//                                     onChange={(e) => setCategoryFilter(e.target.value)}
//                                     className="input-field"
//                                 >
//                                     <option value="">All Categories</option>
//                                     {categories.map(cat => (
//                                         <option key={cat.id} value={cat.id}>{cat.name}</option>
//                                     ))}
//                                 </select>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Items Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                         {filteredItems.map(item => {
//                             const category = categories.find(c => c.id === item.category_id);
//                             return (
//                                 <div key={item.id} className="card hover:shadow-lg transition">
//                                     <div className="flex justify-between items-start">
//                                         <div className="flex-1">
//                                             <div className="flex items-center gap-2 flex-wrap">
//                                                 <h3 className="font-semibold text-gray-900">{item.name}</h3>
//                                                 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                                                     {item.is_available ? 'Available' : 'Unavailable'}
//                                                 </span>
//                                             </div>
//                                             <p className="text-sm text-gray-500 mt-1">{item.description || 'No description'}</p>
//                                             <div className="mt-2 flex items-center gap-3 text-sm">
//                                                 <span className="font-bold text-primary-600">${item.price}</span>
//                                                 {category && <span className="text-gray-400">• {category.name}</span>}
//                                             </div>
//                                         </div>
//                                         <div className="flex gap-1">
//                                             <button
//                                                 onClick={() => { setEditingItem(item); setItemForm({ ...item, category_id: item.category_id || '' }); setShowItemModal(true); }}
//                                                 className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
//                                             >
//                                                 <FaEdit />
//                                             </button>
//                                             <button
//                                                 onClick={() => handleDeleteItem(item.id)}
//                                                 className="p-1.5 text-red-600 hover:bg-red-50 rounded"
//                                             >
//                                                 <FaTrash />
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                         {filteredItems.length === 0 && (
//                             <div className="col-span-full text-center py-8 text-gray-500">No items found</div>
//                         )}
//                     </div>
//                 </>
//             )}

//             {/* Category Modal */}
//             {showCategoryModal && (
//                 <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//                     <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
//                         <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//                             <h2 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
//                             <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="text-gray-500 hover:text-gray-700">×</button>
//                         </div>
//                         <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Name *</label>
//                                 <input
//                                     type="text"
//                                     value={categoryForm.name}
//                                     onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
//                                     className="input-field"
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Description</label>
//                                 <textarea
//                                     value={categoryForm.description}
//                                     onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
//                                     className="input-field"
//                                     rows="2"
//                                 />
//                             </div>
//                             <div className="flex justify-end gap-3">
//                                 <button type="button" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="btn-secondary">Cancel</button>
//                                 <button type="submit" className="btn-primary">{editingCategory ? 'Update' : 'Create'}</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}

//             {/* Item Modal */}
//             {showItemModal && (
//                 <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//                     <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//                         <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
//                             <h2 className="text-lg font-bold">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
//                             <button onClick={() => { setShowItemModal(false); setEditingItem(null); }} className="text-gray-500 hover:text-gray-700">×</button>
//                         </div>
//                         <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Category</label>
//                                 <select
//                                     value={itemForm.category_id}
//                                     onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
//                                     className="input-field"
//                                 >
//                                     <option value="">Select category</option>
//                                     {categories.map(cat => (
//                                         <option key={cat.id} value={cat.id}>{cat.name}</option>
//                                     ))}
//                                 </select>
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Name *</label>
//                                 <input
//                                     type="text"
//                                     value={itemForm.name}
//                                     onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
//                                     className="input-field"
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Description</label>
//                                 <textarea
//                                     value={itemForm.description}
//                                     onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
//                                     className="input-field"
//                                     rows="2"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Price *</label>
//                                 <input
//                                     type="number"
//                                     step="0.01"
//                                     min="0"
//                                     value={itemForm.price}
//                                     onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
//                                     className="input-field"
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700">Image URL</label>
//                                 <input
//                                     type="text"
//                                     value={itemForm.image_url}
//                                     onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
//                                     className="input-field"
//                                     placeholder="https://example.com/image.jpg"
//                                 />
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <input
//                                     type="checkbox"
//                                     checked={itemForm.is_available}
//                                     onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
//                                     className="h-4 w-4 text-primary-600 rounded"
//                                 />
//                                 <label className="text-sm font-medium text-gray-700">Available</label>
//                             </div>
//                             <div className="flex justify-end gap-3 pt-4 border-t">
//                                 <button type="button" onClick={() => { setShowItemModal(false); setEditingItem(null); }} className="btn-secondary">Cancel</button>
//                                 <button type="submit" className="btn-primary">{editingItem ? 'Update' : 'Create'}</button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default FoodMenuPage;