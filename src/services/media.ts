export interface MediaStreams {
  audio: MediaStream | null;
  video: MediaStream | null;
}

class MediaService {
  private audioStream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private videoTrack: MediaStreamTrack | null = null;

  async requestAudioPermission(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      this.audioStream = stream;
      this.audioTrack = stream.getAudioTracks()[0] || null;
      return stream;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return null;
    }
  }

  async requestVideoPermission(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      this.videoStream = stream;
      this.videoTrack = stream.getVideoTracks()[0] || null;
      return stream;
    } catch (error) {
      console.error('Error requesting video permission:', error);
      return null;
    }
  }

  async requestBothPermissions(): Promise<MediaStreams> {
    const result: MediaStreams = { audio: null, video: null };
    
    try {
      // Try to get audio permission
      try {
        result.audio = await this.requestAudioPermission();
      } catch (error) {
        console.warn('Audio permission denied:', error);
      }

      // Try to get video permission
      try {
        result.video = await this.requestVideoPermission();
      } catch (error) {
        console.warn('Video permission denied:', error);
      }

      return result;
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      return result;
    }
  }

  stopAudio(): void {
    if (this.audioTrack) {
      this.audioTrack.stop();
      this.audioTrack = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  stopVideo(): void {
    if (this.videoTrack) {
      this.videoTrack.stop();
      this.videoTrack = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  stopAll(): void {
    this.stopAudio();
    this.stopVideo();
  }

  muteAudio(): void {
    if (this.audioTrack) {
      this.audioTrack.enabled = false;
    }
  }

  unmuteAudio(): void {
    if (this.audioTrack) {
      this.audioTrack.enabled = true;
    }
  }

  disableVideo(): void {
    if (this.videoTrack) {
      this.videoTrack.enabled = false;
    }
  }

  enableVideo(): void {
    if (this.videoTrack) {
      this.videoTrack.enabled = true;
    }
  }

  getAudioStream(): MediaStream | null {
    return this.audioStream;
  }

  getVideoStream(): MediaStream | null {
    return this.videoStream;
  }

  isAudioEnabled(): boolean {
    return this.audioTrack?.enabled || false;
  }

  isVideoEnabled(): boolean {
    return this.videoTrack?.enabled || false;
  }
}

export const mediaService = new MediaService(); 