import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * A stale lazy chunk (e.g. after a redeploy or a dev-server restart) makes the
 * dynamic `import()` behind React.lazy reject. Without a boundary that rejection
 * unmounts the whole tree and the page falls back to the bare dark-blue `body`
 * background ("blue screen"). This boundary catches it and shows a recoverable
 * reload prompt instead — and protects every other render error too.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Route render error:", error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // Failed dynamic import → the deployed/served bundle changed under us.
    // A hard reload pulls the fresh chunk graph.
    const isChunkError = /dynamically imported module|Importing a module|Failed to fetch|ChunkLoadError|Loading chunk/i.test(
      `${error.name} ${error.message}`,
    );

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#fff2e8] px-6 text-center text-[#002f5e]">
        <h1 className="font-odesa-semi text-2xl">
          {isChunkError ? "Оновлено нову версію" : "Щось пішло не так"}
        </h1>
        <p className="max-w-md text-sm text-[#002f5e]/70">
          {isChunkError
            ? "Сторінку було оновлено. Перезавантажте, щоб отримати актуальну версію."
            : "Сталася помилка під час завантаження сторінки. Спробуйте перезавантажити."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="tap rounded-full bg-[#002f5e] px-6 py-2.5 font-odesa-medium text-[#fff2e8] transition hover:opacity-90"
        >
          Перезавантажити
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-2xl overflow-auto rounded-lg bg-[#002f5e]/5 p-4 text-left text-xs text-[#002f5e]/80">
            {error.name}: {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
        )}
      </div>
    );
  }
}
