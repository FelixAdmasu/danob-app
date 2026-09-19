import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="currentColor" />
            <path
                d="M14 10H18C20.2 10 22 11.8 22 14V16H18V14H16V26H14V14H12V10H14ZM26 10H28C30.2 10 32 11.8 32 14V26H30V14H28V10H26Z"
                fill="white"
            />
        </svg>
    );
}
