export const queryKeys = {
  profile: (userId: string | undefined) => ['profile', userId] as const,
  studentCourses: (profileId: string | undefined) => ['studentCourses', profileId] as const,
  cpaAnalytics: (institutionId: string | undefined) => ['cpaAnalytics', institutionId] as const,
  notifications: (userId: string | undefined) => ['notifications', userId] as const,
  social: {
    posts: () => ['social', 'posts'] as const,
    comments: (postId: string) => ['social', 'comments', postId] as const,
  },
  chat: {
    rooms: () => ['chat', 'rooms'] as const,
    messages: (roomId: string) => ['chat', 'messages', roomId] as const,
  },
  studentDocuments: (profileId: string | undefined) => ['studentDocuments', profileId] as const,
  studentFinancials: (profileId: string | undefined) => ['studentFinancials', profileId] as const,
  studentGrades: (profileId: string | undefined) => ['studentGrades', profileId] as const,
};
