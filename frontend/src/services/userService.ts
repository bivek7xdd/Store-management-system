import api from "./api";

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  profile_picture?: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
}

export interface UpdateStoreData {
  name?: string;
  address?: string;
  currency_code?: string;
}

export const userService = {
  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put("/users/profile", data);
    return response.data;
  },
  
  updatePassword: async (data: UpdatePasswordData) => {
    const response = await api.put("/users/password", data);
    return response.data;
  },
  
  updateStore: async (data: UpdateStoreData) => {
    const response = await api.put("/users/store", data);
    return response.data;
  },
  
  getStore: async () => {
    const response = await api.get("/users/store");
    return response.data;
  }
};
