import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  // Коли задано (навіть null) — тихий режим для дрібних "хром"-компонентів
  // (MobileNav, музика, тощо), що рендеряться поза основним роутом: просто
  // ховаємо зламаний шматок замість повноекранного "щось пішло не так".
  fallback?: ReactNode;
  // Зміна будь-якого значення в масиві скидає впійману помилку. Без цього
  // boundary "застряє" в fallback НАЗАВЖДИ після першого падіння — саме так
  // зникала кнопка асистента: якщо AssistantFab кидав помилку хоч раз під час
  // анімації входу/виходу з /asystent, fallback=null рендерився і на всіх
  // наступних сторінках теж, без жодного способу відновитись без reload.
  resetKeys?: unknown[];
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

  componentDidMount() {
    // Успішний рендер без помилки — знімаємо прапорець одноразового
    // auto-reload, щоб наступний РЕАЛЬНИЙ chunk-error (після майбутнього
    // деплою) теж міг спрацювати автоматично, а не мовчки пропав назавжди.
    sessionStorage.removeItem("chunk-error-reload");
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Route render error:", error);
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.state.error) return;
    const prevKeys = prevProps.resetKeys ?? [];
    const nextKeys = this.props.resetKeys ?? [];
    if (nextKeys.length !== prevKeys.length || nextKeys.some((k, i) => k !== prevKeys[i])) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback !== undefined) return this.props.fallback;

    // Failed dynamic import → the deployed/served bundle changed under us.
    // A hard reload pulls the fresh chunk graph.
    const isChunkError = /dynamically imported module|Importing a module|Failed to fetch|ChunkLoadError|Loading chunk/i.test(
      `${error.name} ${error.message}`,
    );

    // Стара вкладка, що пережила редеплой (нові хешовані чанки замінили старі
    // на диску) — замість того щоб показувати екран і чекати на ручний клік,
    // перезавантажуємо ОДИН раз автоматично. Прапорець у sessionStorage —
    // щоб не зациклитись, якщо помилка повториться і після reload.
    if (isChunkError && typeof window !== "undefined") {
      const key = "chunk-error-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return null;
      }
    }

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
