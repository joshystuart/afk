import { create } from 'zustand';
import type { DockerImage, CreateDockerImageRequest } from '../api/types';
import { dockerImagesApi } from '../api/docker-images.api';

interface DockerImagesState {
  images: DockerImage[];
  loading: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  addImage: (request: CreateDockerImageRequest) => Promise<DockerImage>;
  removeImage: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  retryPull: (id: string) => Promise<void>;
  pollStatus: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDockerImagesStore = create<DockerImagesState>((set, get) => ({
  images: [],
  loading: false,
  error: null,

  fetchImages: async () => {
    set({ loading: true, error: null });
    try {
      const images = await dockerImagesApi.list();
      set({ images, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch Docker images',
        loading: false,
      });
    }
  },

  addImage: async (request: CreateDockerImageRequest) => {
    set({ error: null });
    try {
      const image = await dockerImagesApi.create(request);
      set((state) => ({ images: [...state.images, image] }));
      return image;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to register Docker image';
      set({ error: message });
      throw error;
    }
  },

  removeImage: async (id: string) => {
    set({ error: null });
    try {
      await dockerImagesApi.remove(id);
      set((state) => ({
        images: state.images.filter((img) => img.id !== id),
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete Docker image';
      set({ error: message });
      throw error;
    }
  },

  setDefault: async (id: string) => {
    set({ error: null });
    try {
      const updated = await dockerImagesApi.setDefault(id);
      set((state) => ({
        images: state.images.map((img) => ({
          ...img,
          isDefault: img.id === updated.id,
        })),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to set default image';
      set({ error: message });
      throw error;
    }
  },

  retryPull: async (id: string) => {
    set({ error: null });
    try {
      const updated = await dockerImagesApi.retry(id);
      set((state) => ({
        images: state.images.map((img) =>
          img.id === updated.id ? updated : img,
        ),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to retry pull';
      set({ error: message });
      throw error;
    }
  },

  pollStatus: async (id: string) => {
    try {
      const updated = await dockerImagesApi.getStatus(id);
      set((state) => ({
        images: state.images.map((img) =>
          img.id === updated.id ? updated : img,
        ),
      }));
    } catch {
      // Silently fail on polls
    }
  },

  clearError: () => set({ error: null }),
}));
