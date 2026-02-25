"""
[AI] API Client - Frontend Utilities
Functions for making API calls to the backend from React components
"""

import axios from 'axios';

// [AI] Configure API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// [AI] Interceptor to add JWT token to all requests if it exists
apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// [AI] Authentication API calls
export const authAPI = {
    // User login
    login: async (username, password) => {
        try {
            const response = await apiClient.post('/auth/login', { username, password });
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // User registration
    register: async (userData) => {
        try {
            const response = await apiClient.post('/auth/register', userData);
            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // User logout
    logout: () => {
        localStorage.removeItem('authToken');
    }
};

// [AI] Portfolio API calls
export const portfolioAPI = {
    // Get all portfolios for user
    getPortfolios: async () => {
        try {
            const response = await apiClient.get('/portfolios');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get single portfolio details
    getPortfolio: async (portfolioId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create new portfolio
    createPortfolio: async (portfolioData) => {
        try {
            const response = await apiClient.post('/portfolios', portfolioData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// [AI] Holdings API calls
export const holdingsAPI = {
    // Get all holdings in a portfolio
    getHoldings: async (portfolioId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}/holdings`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get single holding details
    getHolding: async (portfolioId, holdingId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}/holdings/${holdingId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// [AI] Transaction API calls
export const transactionAPI = {
    // Buy stock
    buyStock: async (portfolioId, transactionData) => {
        try {
            const response = await apiClient.post(`/portfolios/${portfolioId}/buy`, transactionData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Sell stock
    sellStock: async (portfolioId, transactionData) => {
        try {
            const response = await apiClient.post(`/portfolios/${portfolioId}/sell`, transactionData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get transaction history
    getTransactions: async (portfolioId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}/transactions`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// [AI] Watchlist API calls
export const watchlistAPI = {
    // Get watchlist
    getWatchlist: async (portfolioId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}/watchlist`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Add to watchlist
    addToWatchlist: async (portfolioId, stockSymbol) => {
        try {
            const response = await apiClient.post(`/portfolios/${portfolioId}/watchlist`, { stock_symbol: stockSymbol });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Remove from watchlist
    removeFromWatchlist: async (portfolioId, watchlistId) => {
        try {
            const response = await apiClient.delete(`/portfolios/${portfolioId}/watchlist/${watchlistId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

// [AI] News API calls
export const newsAPI = {
    // Get portfolio news
    getPortfolioNews: async (portfolioId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}/news`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get watchlist news
    getWatchlistNews: async (portfolioId) => {
        try {
            const response = await apiClient.get(`/portfolios/${portfolioId}/watchlist-news`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get general business news
    getBusinessNews: async () => {
        try {
            const response = await apiClient.get('/news/business');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default apiClient;
