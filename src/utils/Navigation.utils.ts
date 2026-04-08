let navigateFn: (path: string) => void;

export const setNavigator = (navFn: (path: string) => void) => {
  navigateFn = navFn;
};

export const navigateTo = (path: string) => {
  if (navigateFn) {
    navigateFn(path);
    return;
  }

  window.location.assign(path);
};
