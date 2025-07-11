import React, { memo, ComponentType, NamedExoticComponent } from 'react';

type Props = {
  [key: string]: any;
};

export function withOptimization<P extends Props>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): NamedExoticComponent<P> {
  return memo(Component, propsAreEqual) as NamedExoticComponent<P>;
}
