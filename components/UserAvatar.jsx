import React from 'react';

// Menampilkan avatar pengguna. Jika photoURL kosong atau gagal dimuat,
// jatuh ke avatar inisial dari layanan ui-avatars.com.
const UserAvatar = ({ name, photoURL = "", className = "w-6 h-6", size = 128 }) => {
  const safeName = typeof name === 'string' ? name : 'User';
  const [hasPhotoError, setHasPhotoError] = React.useState(false);
  const seed = encodeURIComponent(safeName);
  const src = !hasPhotoError && photoURL
    ? photoURL
    : `https://ui-avatars.com/api/?name=${seed}&background=random&color=fff&size=${size}&rounded=true&bold=true`;

  React.useEffect(() => {
    setHasPhotoError(false);
  }, [photoURL, safeName]);

  return (
    <img
      src={src}
      alt={safeName}
      className={`rounded-full object-cover border border-white shadow-sm flex-shrink-0 ${className}`}
      title={safeName}
      onError={() => setHasPhotoError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

export default UserAvatar;
