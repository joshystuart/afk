import { apiClient } from './client';
import type { DockerImage, CreateDockerImageRequest } from './types';

export const dockerImagesApi = {
  async list(): Promise<DockerImage[]> {
    const response = await apiClient.get<DockerImage[]>('/docker/images');
    return response as unknown as DockerImage[];
  },

  async create(request: CreateDockerImageRequest): Promise<DockerImage> {
    const response = await apiClient.post<DockerImage>(
      '/docker/images',
      request,
    );
    return response as unknown as DockerImage;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/docker/images/${id}`);
  },

  async setDefault(id: string): Promise<DockerImage> {
    const response = await apiClient.patch<DockerImage>(
      `/docker/images/${id}/default`,
    );
    return response as unknown as DockerImage;
  },

  async getStatus(id: string): Promise<DockerImage> {
    const response = await apiClient.get<DockerImage>(
      `/docker/images/${id}/status`,
    );
    return response as unknown as DockerImage;
  },

  async install(id: string): Promise<DockerImage> {
    const response = await apiClient.post<DockerImage>(
      `/docker/images/${id}/install`,
    );
    return response as unknown as DockerImage;
  },

  async retry(id: string): Promise<DockerImage> {
    const response = await apiClient.post<DockerImage>(
      `/docker/images/${id}/retry`,
    );
    return response as unknown as DockerImage;
  },
};
