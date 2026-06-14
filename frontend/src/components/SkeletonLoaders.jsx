import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Dashboard page skeletons
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#fffaf0] dark:bg-slate-900 px-6 py-10 font-patrick">
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <Skeleton width={320} height={40} className="dark:bg-slate-700" />
          <div className="mt-2"><Skeleton width={200} height={24} className="dark:bg-slate-700" /></div>
        </div>
        <div className="flex gap-3">
          <Skeleton width={100} height={44} className="dark:bg-slate-700" />
          <Skeleton width={80} height={44} className="dark:bg-slate-700" />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="doodle-card p-6 dark:bg-slate-800 dark:border-slate-600">
            <Skeleton width={180} height={28} className="dark:bg-slate-700" />
            <div className="mt-4 space-y-4">
              <Skeleton width="100%" height={44} className="dark:bg-slate-700" />
              <Skeleton width="100%" height={48} className="dark:bg-slate-700" />
            </div>
          </div>
          <div className="doodle-card p-6 dark:bg-slate-800 dark:border-slate-600">
            <Skeleton width={140} height={28} className="dark:bg-slate-700" />
            <div className="mt-4 space-y-4">
              <Skeleton width="100%" height={44} className="dark:bg-slate-700" />
              <Skeleton width="100%" height={48} className="dark:bg-slate-700" />
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="lg:col-span-2">
          <div className="doodle-card p-6 dark:bg-slate-800 dark:border-slate-600 min-h-[400px]">
            <Skeleton width={160} height={32} className="dark:bg-slate-700" />
            <div className="grid gap-6 sm:grid-cols-2 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="doodle-card p-5 dark:bg-slate-700 dark:border-slate-600">
                  <Skeleton width="70%" height={24} className="dark:bg-slate-600" />
                  <div className="mt-3"><Skeleton count={2} className="dark:bg-slate-600" /></div>
                  <div className="mt-3 flex justify-between">
                    <Skeleton width={80} height={16} className="dark:bg-slate-600" />
                    <Skeleton width={80} height={16} className="dark:bg-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Meeting room loading skeleton
export const MeetingRoomSkeleton = () => (
  <div className="h-screen bg-[#fffaf0] dark:bg-slate-900 flex flex-col font-patrick">
    <div className="h-16 border-b-2 border-slate-200 dark:border-slate-700 flex items-center px-6">
      <Skeleton width={200} height={28} />
    </div>
    <div className="flex-1 flex p-6 gap-6">
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-video doodle-card dark:bg-slate-800 dark:border-slate-600 flex items-center justify-center">
            <Skeleton circle width={60} height={60} />
          </div>
        ))}
      </div>
    </div>
    <div className="h-20 bg-slate-800 flex items-center justify-center">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} width={64} height={56} className="bg-slate-700" />
        ))}
      </div>
    </div>
  </div>
);

// Auth page skeleton
export const AuthFormSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#fffaf0] dark:bg-slate-900 px-4 font-patrick">
    <div className="w-full max-w-md doodle-card p-8 dark:bg-slate-800 dark:border-slate-600">
      <Skeleton width={280} height={36} className="dark:bg-slate-700" />
      <div className="mt-2"><Skeleton width={200} height={20} className="dark:bg-slate-700" /></div>
      <div className="mt-6 space-y-5">
        <Skeleton width="100%" height={48} className="dark:bg-slate-700" />
        <Skeleton width="100%" height={48} className="dark:bg-slate-700" />
        <Skeleton width="100%" height={52} className="dark:bg-slate-700" />
      </div>
      <div className="mt-8"><Skeleton width={200} height={20} className="dark:bg-slate-700" /></div>
    </div>
  </div>
);

// Chat/message skeleton
export const ChatSkeleton = () => (
  <div className="h-full flex flex-col p-4 space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
        <Skeleton circle width={32} height={32} />
        <div className={`max-w-[70%] space-y-1 ${i % 2 === 0 ? 'items-end' : ''}`}>
          <Skeleton width={120} height={16} />
          <Skeleton width={180 + (i * 20)} height={14} />
        </div>
      </div>
    ))}
  </div>
);

// Participant list skeleton
export const ParticipantSkeleton = () => (
  <div className="space-y-3 p-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton circle width={36} height={36} />
        <div className="flex-1">
          <Skeleton width={100} height={16} />
          <Skeleton width={60} height={12} />
        </div>
      </div>
    ))}
  </div>
);
