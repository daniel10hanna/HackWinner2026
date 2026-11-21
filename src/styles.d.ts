declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.jpg' {
  const image: number;
  export default image;
}
