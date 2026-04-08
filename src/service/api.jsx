import axios from 'axios';

const API_BASE = "http://localhost:8085"

// =====================================================
// AXIOS INSTANCE
// =====================================================
const api = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// =====================================================
// INTERCEPTORS
// =====================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// =====================================================
// AUTH API
// =====================================================

// REGISTER
export const registerUser = async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
};

// LOGIN
export const loginUser = (loginData) =>
    api.post('/auth/login', loginData);


export const fetchWorkspaceUsers = async () => {
    const res = await api.get('/auth/workspace/users');
    return res.data;
};

export const updateUser = async (userId, data) => {
    const res = await api.put(`/auth/workspace/users/${userId}`, data);
    return res.data;
};
export const deleteUser = async (userId) => {
    const res = await api.delete(`/auth/workspace/users/${userId}`);
    return res.data;
};
// =====================================================
// TRANSACTION API
// =====================================================

// GET ALL (pagination + search)
export const fetchTransactions = async ({
                                            keyword = '',
                                            page = 0,
                                            size = 10,
                                        }) => {
    const res = await api.get('/transactions', {
        params: { keyword, page, size },
    });
    return res.data;
};

// GET BY ID
export const fetchTransactionById = async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
};

// CREATE
export const createTransaction = async (data) => {
    const res = await api.post('/transactions', data);
    return res.data;
};

// UPDATE
export const updateTransaction = async (id, data) => {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
};

// DELETE
export const deleteTransaction = async (id) => {
    await api.delete(`/transactions/${id}`);
};

// NET POSITION
export const fetchNetPosition = async () => {
    const res = await api.get('/transactions/net');
    return res.data;
};

// FILTER (Pageable supported)
export const filterTransactions = async (filterData, page = 0, size = 10) => {
    const res = await api.post('/transactions/filter', filterData, {
        params: { page, size },
    });
    return res.data;
};

// =====================================================
// PDF DOWNLOAD
// =====================================================
const downloadPdf = async (url, filename) => {
    const response = await api.get(url, {
        responseType: 'blob',
    });

    const blob = new Blob([response.data], {
        type: 'application/pdf',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// EXPORT PDF
export const exportTransactionsPdf = () =>
    downloadPdf('/transactions/pdf', `transactions_${Date.now()}.pdf`);

// =====================================================
// EXPORT INSTANCE
// =====================================================
export default api;