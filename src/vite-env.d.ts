/// <reference types="vite/client" />

declare module 'stats.js' {
  export default class Stats {
    dom: HTMLDivElement;
    begin(): void;
    end(): void;
  }
}