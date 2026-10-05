'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PARAM = 'requestId';

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
};

function LinkWithRequestId({ href, ...rest }: Props) {
  const requestId = useSearchParams()?.get(PARAM);

  const separator = href.includes('?') ? '&' : '?';
  const url = requestId
    ? `${href}${separator}${PARAM}=${encodeURIComponent(requestId)}`
    : href;

  return <a href={url} {...rest} />;
}

export default function RequestIdLink(props: Props) {
  return (
    <Suspense fallback={<a {...props} />}>
      <LinkWithRequestId {...props} />
    </Suspense>
  );
}
