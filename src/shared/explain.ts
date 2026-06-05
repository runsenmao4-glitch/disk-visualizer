import type { Explanation, RiskLevel } from "./types.js";

interface Rule {
  pattern: RegExp;
  label: string;
  risk: RiskLevel;
  description: string;
}

const rules: Rule[] = [
  {
    pattern: /(^|\\)winsxs($|\\)/i,
    label: "Windows 组件仓库",
    risk: "danger",
    description: "系统更新、回滚和功能组件仓库。不要手动删除，只能用系统清理工具处理。"
  },
  {
    pattern: /(^|\\)(system32|syswow64)($|\\)/i,
    label: "Windows 核心系统目录",
    risk: "danger",
    description: "包含系统文件、驱动和运行库。手动删除可能导致系统或软件无法启动。"
  },
  {
    pattern: /(^|\\)windows\\installer($|\\)/i,
    label: "Windows 安装缓存",
    risk: "danger",
    description: "用于修复、卸载和更新 MSI 软件。不要直接删除其中的 MSI/MSP 文件。"
  },
  {
    pattern: /(^|\\)windows\\temp($|\\)/i,
    label: "Windows 临时文件",
    risk: "safe",
    description: "系统临时和诊断文件。通常可清理，但正在使用的文件会被系统锁定。"
  },
  {
    pattern: /(^|\\)windows($|\\)/i,
    label: "Windows 系统目录",
    risk: "danger",
    description: "操作系统主体目录。只建议通过 Windows 设置、磁盘清理或 DISM 清理。"
  },
  {
    pattern: /(^|\\)\$recycle\.bin($|\\)/i,
    label: "回收站",
    risk: "safe",
    description: "已删除文件暂存区。确认不需要恢复后可以清空回收站释放空间。"
  },
  {
    pattern: /(^|\\)(pagefile\.sys|swapfile\.sys)$/i,
    label: "系统虚拟内存文件",
    risk: "danger",
    description: "Windows 用于内存交换的系统文件。不建议手动删除或移动。"
  },
  {
    pattern: /(^|\\)program files( \(x86\))?($|\\)/i,
    label: "软件安装目录",
    risk: "caution",
    description: "应用程序安装位置。卸载软件请使用设置或卸载器，不要直接删除目录。"
  },
  {
    pattern: /(^|\\)programdata($|\\)/i,
    label: "全局应用数据",
    risk: "caution",
    description: "多个用户共享的应用数据和安装缓存。删除前需确认对应软件用途。"
  },
  {
    pattern: /(^|\\)users($|\\)/i,
    label: "用户数据目录",
    risk: "caution",
    description: "包含桌面、文档、下载、配置和缓存。应按子目录判断，不建议整目录处理。"
  },
  {
    pattern: /(^|\\)appdata($|\\)/i,
    label: "应用用户数据",
    risk: "caution",
    description: "软件配置、登录状态和缓存集中位置。缓存可清，配置和数据库需谨慎。"
  },
  {
    pattern: /(^|\\)(local|roaming)($|\\)/i,
    label: "应用配置区域",
    risk: "caution",
    description: "Local 多为缓存和本机数据，Roaming 多为配置和账户数据。清理前看具体软件。"
  },
  {
    pattern: /(^|\\)(npm-cache|_cacache)($|\\)/i,
    label: "npm 包缓存",
    risk: "safe",
    description: "Node.js 依赖下载缓存。清理后以后 npm install 会重新下载。"
  },
  {
    pattern: /(^|\\)uv\\cache($|\\)|(^|\\)uv($|\\)/i,
    label: "uv Python 缓存",
    risk: "safe",
    description: "uv 的依赖、源码和 wheel 缓存。清理后以后安装 Python 依赖会重新下载。"
  },
  {
    pattern: /(^|\\)pip($|\\)/i,
    label: "pip 缓存",
    risk: "safe",
    description: "Python 包下载缓存。通常可清理，会影响下一次安装速度。"
  },
  {
    pattern: /(^|\\)huggingface($|\\)/i,
    label: "Hugging Face 模型缓存",
    risk: "caution",
    description: "AI 模型缓存。可迁移或删除，但再次使用模型时可能需要大流量重新下载。"
  },
  {
    pattern: /(^|\\)docker($|\\)/i,
    label: "Docker 相关数据",
    risk: "caution",
    description: "可能包含镜像、容器或 Docker 程序。建议用 Docker Desktop 或命令清理。"
  },
  {
    pattern: /(^|\\)(steamapps\\common|steam library|steamlibrary)($|\\)/i,
    label: "Steam 游戏库",
    risk: "caution",
    description: "通常是已安装游戏。释放空间建议在 Steam 中卸载或移动库，不要直接删除公共组件。"
  },
  {
    pattern: /(^|\\)(epic games|epicgameslauncher)($|\\)/i,
    label: "Epic Games 相关目录",
    risk: "caution",
    description: "可能是 Epic 游戏或启动器数据。建议通过 Epic 启动器管理安装和卸载。"
  },
  {
    pattern: /(^|\\)(tencent|xwechat|wechat|qq|wegame)($|\\)/i,
    label: "腾讯/微信/QQ 数据",
    risk: "caution",
    description: "可能包含聊天、缓存、游戏或登录数据。清理前先确认聊天记录和文件已备份。"
  },
  {
    pattern: /(^|\\)(kingsoft|wps|wps office)($|\\)/i,
    label: "WPS/金山数据",
    risk: "caution",
    description: "可能包含 WPS 配置、模板、云文档缓存和登录状态。卸载或迁移前建议确认数据同步。"
  },
  {
    pattern: /(^|\\)(microsoft visual studio|visual studio)($|\\)/i,
    label: "Visual Studio",
    risk: "caution",
    description: "微软开发工具。若不用开发环境，建议从设置或 Visual Studio Installer 卸载。"
  },
  {
    pattern: /(^|\\)windows kits($|\\)/i,
    label: "Windows SDK/开发工具包",
    risk: "caution",
    description: "通常由 Visual Studio 或编译工具安装。不要直接删除，建议通过安装器卸载。"
  },
  {
    pattern: /(^|\\)(wsl|ext4\.vhdx)($|\\)/i,
    label: "WSL Linux 数据",
    risk: "danger",
    description: "WSL 发行版或虚拟磁盘数据。不要手动删除，需通过 wsl 命令管理。"
  },
  {
    pattern: /(^|\\)notion($|\\)/i,
    label: "Notion 数据",
    risk: "caution",
    description: "Notion 本地数据库、缓存和登录数据。迁移可用目录联接，删除前确认已同步。"
  },
  {
    pattern: /(^|\\)jianyingpro($|\\)/i,
    label: "剪映用户数据",
    risk: "caution",
    description: "剪映缓存、项目索引和配置。缓存可清，Projects/Config/MMKV 需谨慎。"
  }
];

export function explainPath(path: string, isProtected = false, isLink = false): Explanation {
  if (isProtected) {
    return {
      label: "受保护或无权限",
      risk: "info",
      description: "当前用户无法完整读取此目录，扫描已跳过或只统计到可访问部分。"
    };
  }

  if (isLink) {
    return {
      label: "目录联接或符号链接",
      risk: "info",
      description: "这是指向其他位置的链接。为避免重复统计，工具不会递归扫描链接目标。"
    };
  }

  const normalized = path.replace(/\//g, "\\").toLowerCase();
  const match = rules.find((rule) => rule.pattern.test(normalized));
  if (match) {
    return {
      label: match.label,
      risk: match.risk,
      description: match.description
    };
  }

  return {
    label: "普通文件或目录",
    risk: "info",
    description: "未匹配到特殊系统规则。建议结合路径、大小和所属软件判断用途。"
  };
}
