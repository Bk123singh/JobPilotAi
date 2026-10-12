import React, { useState } from 'react';
import { getInitials, getUserDisplayName } from '../../utils/userUtils';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px] rounded-md',
  sm: 'w-7 h-7 text-xs rounded-lg',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-14 h-14 text-lg rounded-2xl',
  xl: 'w-20 h-20 text-2xl rounded-2xl',
};

const UserAvatar = ({
  user = null,
  name = '',
  avatarUrl = null,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const resolvedName = name || getUserDisplayName(user);
  const resolvedAvatar = avatarUrl || user?.avatarUrl || user?.profile?.avatarUrl;
  const initials = getInitials(resolvedName);
  const sizeClasses = sizeMap[size] || sizeMap.md;

  if (resolvedAvatar && !imageError) {
    return (
      <img
        src={resolvedAvatar}
        alt={resolvedName}
        onError={() => setImageError(true)}
        className={`${sizeClasses} object-cover ring-1 ring-slate-200/80 shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br from-indigo-500 via-brand-600 to-purple-600 text-white flex items-center justify-center font-bold tracking-tight shadow-sm select-none ${className}`}
      title={resolvedName}
      aria-label={resolvedName}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
