import axios from "axios";
import { useBoundStore } from "../../store/BoundedStore";
import { navigateTo } from "../../utils/Navigation.utils";
import { StorageUtils } from "../../utils/StorageUtils";

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	timeout: 60000,
	headers: {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
	},
});

apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { logOutUser } = useBoundStore.getState();

		if (error.response?.status === 401) {
			StorageUtils.clearAllStorage();
			localStorage.removeItem("token");
			logOutUser();
			navigateTo("/login");
		}

		throw error;
	},
);

export default apiClient;
