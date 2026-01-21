import React from 'react';

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 280 50"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <text
      x="5"
      y="35"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
      fontSize="36"
      fontWeight="700"
      fill="white"
      letterSpacing="-1"
    >
      Create.AI
    </text>
    <path
      d="M230,8 C240,5 255,10 260,20 C265,30 255,42 245,40 C235,38 238,28 242,25 C248,20 252,22 250,28 L240,32 C235,25 232,20 230,15 Z"
      fill="#DAB88B"
    />
  </svg>
);