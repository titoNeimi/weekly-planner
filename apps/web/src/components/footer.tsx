export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-4">
      <p className="mx-auto max-w-5xl px-4 text-center text-xs text-gray-400 dark:text-gray-500 sm:px-6">
        Made by{" "}
        <a
          href="https://jnahmod.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-400 hover:text-primary transition"
        >
          jnahmod.dev
        </a>
      </p>
    </footer>
  );
}
