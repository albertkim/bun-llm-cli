import SystemInformation from "systeminformation"

class SystemStore {
  public operatingSystem: string
  public architecture: string
  public cpuCores: number
  public gpu: string | null

  constructor() {
    this.operatingSystem = ""
    this.architecture = ""
    this.cpuCores = 0
    this.gpu = null
  }

  public async init() {
    this.operatingSystem = (await SystemInformation.osInfo()).platform
    this.architecture = (await SystemInformation.osInfo()).arch
    this.cpuCores = (await SystemInformation.cpu()).cores
    this.gpu = (await SystemInformation.graphics()).controllers[0]?.name ?? null
  }
}

export const systemStore = new SystemStore()
