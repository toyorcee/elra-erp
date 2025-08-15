import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { updateProfile, uploadProfilePicture } from "../services/profile";
import { useEffect } from "react";

export const PROFILE_QUERY_KEY = ["profile"];

export const useProfile = () => {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?._id) {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    }
  }, [user?._id, queryClient]);

  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => Promise.resolve(user),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      // Update auth context
      updateAuthProfile(response.data.user);

      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

      // Update the cache with new data
      queryClient.setQueryData(PROFILE_QUERY_KEY, response.data.user);
    },
  });

  // Mutation for uploading profile picture
  const uploadProfilePictureMutation = useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: (response) => {
      // Update auth context
      updateAuthProfile(response.data.user);

      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

      // Update the cache with new data
      queryClient.setQueryData(PROFILE_QUERY_KEY, response.data.user);
    },
  });

  return {
    profileData,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    uploadProfilePicture: uploadProfilePictureMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUploadingPicture: uploadProfilePictureMutation.isPending,
  };
};
