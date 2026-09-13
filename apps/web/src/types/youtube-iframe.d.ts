// Globals set by https://www.youtube.com/iframe_api. The `YT` namespace itself
// comes from @types/youtube; only the window hooks are missing there.
interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
