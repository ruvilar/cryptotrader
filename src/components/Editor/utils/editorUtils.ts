export function debounce<Func extends (...args: any[]) => void>(fn: Func, delay: number) {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<Func>) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }