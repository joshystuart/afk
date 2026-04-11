import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import type { SkillInfo } from '../api/types';

export function useSkills() {
  const { data, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => settingsApi.listSkills(),
    staleTime: 5 * 60 * 1000,
  });

  const skills: SkillInfo[] = data?.skills ?? [];

  return { skills, isLoading };
}
