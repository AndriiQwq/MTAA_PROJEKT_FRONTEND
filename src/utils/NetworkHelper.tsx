import NetInfo from '@react-native-community/netinfo';

// This code was genereded by ChatGPT and is not a direct copy of any existing code.

export class NetworkHelper {
  static async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }
  
  static addConnectionListener(callback: (isConnected: boolean) => void) {
    return NetInfo.addEventListener(state => {
      callback(state.isConnected ?? false);
    });
  }
}