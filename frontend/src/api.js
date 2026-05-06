import axios from "axios";

const runtimeApiBase = typeof window !== "undefined" ? window.location.origin : "";

export const API_BASE_URL = import.meta.env.VITE_API_URL || runtimeApiBase;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const uploadDataset = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get("/summary");
  return response.data;
};

export const getDatasets = async () => {
  const response = await api.get("/datasets");
  return response.data;
};

export const selectDataset = async (filename) => {
  const response = await api.post("/datasets/select", { filename });
  return response.data;
};

export const rankScenario = async (scenario) => {
  const response = await api.post("/rank", { scenario });
  return response.data;
};
 
export const deleteDataset = async (filename) => {
  const response = await api.delete(`/datasets/${filename}`);
  return response.data;
};



export const processedDownloadUrl = `${API_BASE_URL}/download/processed`;
