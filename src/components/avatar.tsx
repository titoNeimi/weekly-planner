type AvatarProps = {
  avatarUrl?: string;
  name?: string;
  email?: string;
};

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

export default function Avatar({ avatarUrl, name, email }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="h-7 w-7 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-7 w-7 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold select-none">
      {getInitials(name, email)}
    </div>
  );
}
