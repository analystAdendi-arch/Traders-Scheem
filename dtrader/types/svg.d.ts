declare module '*.svg' {
    const content: React.ComponentType<React.SVGAttributes<SVGElement>>;
    export default content;
}

declare module '*.webp' {
    let content: string;
    export default content;
}
