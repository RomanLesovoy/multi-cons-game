import { ConnectionManager } from "../../app/services/ConnectionManager";

export abstract class BaseManager {
  constructor(
    protected readonly connectionManager: ConnectionManager
  ) {}

  protected onlyMasterPeerDecorator(fn: (...args: any[]) => void) {
    if (!this.connectionManager.isMasterPeer) return;
    fn();
  }
}
