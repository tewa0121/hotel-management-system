// ============================================
// FRONTEND FORMATTERS
// ============================================

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  if (isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'datetime':
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return d.toLocaleDateString();
  }
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Capitalize each word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
};

// Format room status for display
export const formatRoomStatus = (status) => {
  const statusMap = {
    available: 'Available',
    reserved: 'Reserved',
    occupied: 'Occupied',
    dirty: 'Dirty',
    cleaning: 'Cleaning',
    maintenance: 'Maintenance',
    out_of_service: 'Out of Service'
  };
  return statusMap[status] || status || 'Unknown';
};

// Get status color for UI
export const getStatusColor = (status) => {
  const colorMap = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-blue-100 text-blue-800',
    occupied: 'bg-yellow-100 text-yellow-800',
    dirty: 'bg-orange-100 text-orange-800',
    cleaning: 'bg-purple-100 text-purple-800',
    maintenance: 'bg-red-100 text-red-800',
    out_of_service: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    checked_in: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Format number with commas
export const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration in minutes
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
};