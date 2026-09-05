#!/usr/bin/env bash
# ============================================================
#   {{TITLE}}  ·  VPS 脚本合集工具箱
# ------------------------------------------------------------
#   版本: {{VERSION}}        生成时间: {{GENERATED_AT}}
#   来源: {{SOURCE_URL}}/spellbook.sh
#   本文件由 spellbook 管理端自动生成，数据区请勿手工编辑；
#   在网页端修改合集后，在 VPS 上执行 `spellbook update` 即可同步。
# ------------------------------------------------------------
#   收录 {{SCRIPT_COUNT}} 个脚本 / {{CATEGORY_COUNT}} 个分类：
#
{{CATALOG}}
#
#   用法:
#     bash <(curl -sL {{SOURCE_URL}}/spellbook.sh)              # 直接打开菜单
#     bash <(curl -sL {{SOURCE_URL}}/spellbook.sh) install      # 安装为 spellbook 命令
#     spellbook            交互菜单        spellbook list      列出全部
#     spellbook <编号>     直达执行        spellbook search 词  搜索
#     spellbook update     自更新          spellbook about      关于
# ============================================================

# ---------------- 元信息（base64 编码，防止注入） ----------------
SB_TITLE_B64='{{TITLE_B64}}'
SB_VERSION_B64='{{VERSION_B64}}'
SB_URL_B64='{{SOURCE_URL_B64}}'
SB_DATA='{{DATA_BLOCK}}'

SB_HOME="$HOME/.spellbook"
SB_FAV_FILE="$SB_HOME/favorites.conf"
SB_CUSTOM_FILE="$SB_HOME/custom.conf"
SB_INSTALL_TARGET="/usr/local/bin/spellbook"

# ---------------- 基础工具 ----------------
RED='\033[31m'; GREEN='\033[32m'; YELLOW='\033[33m'
BLUE='\033[34m'; PURPLE='\033[35m'; CYAN='\033[36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { printf "${GREEN}[✓]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$*"; }
err()  { printf "${RED}[✗]${NC} %s\n" "$*"; }
info() { printf "${CYAN}[i]${NC} %s\n" "$*"; }
line() { printf "${BLUE}  ──────────────────────────────────────────────${NC}\n"; }

sb_b64d() { printf '%s' "$1" | base64 -d 2>/dev/null; }

sb_fetch() { # sb_fetch <url>  → stdout
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    err "未找到 curl 或 wget，请先安装"; return 1
  fi
}

has_flag() { [[ ",$1," == *",$2,"* ]]; }

sb_banner() {
  [[ -t 1 ]] && clear
  echo
  echo -e "${BOLD}${CYAN}  ╔════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}  ║   📖 $(sb_b64d "$SB_TITLE_B64")  v$(sb_b64d "$SB_VERSION_B64")${NC}"
  echo -e "${BOLD}${CYAN}  ╚════════════════════════════════════════════╝${NC}"
}

# ---------------- 数据解析 ----------------
CAT_ICON=(); CAT_NAME=()
S_CAT=(); S_TYPE=(); S_FLAGS=(); S_NAME=(); S_DESC=(); S_CMD=()

sb_parse_data() {
  local ln idx icon name c t f n d cmd
  while IFS= read -r ln; do
    case "$ln" in
      C\|*)
        IFS='|' read -r idx icon name <<< "${ln#C|}"
        CAT_ICON[$idx]="$(sb_b64d "$icon")"
        CAT_NAME[$idx]="$(sb_b64d "$name")"
        ;;
      S\|*)
        IFS='|' read -r c t f n d cmd <<< "${ln#S|}"
        S_CAT+=("$c"); S_TYPE+=("$t"); S_FLAGS+=("$f")
        S_NAME+=("$(sb_b64d "$n")")
        S_DESC+=("$(sb_b64d "$d")")
        S_CMD+=("$(sb_b64d "$cmd")")
        ;;
    esac
  done <<< "$SB_DATA"
}

sb_cat_count() { local i max=0; for i in "${!CAT_NAME[@]}"; do (( i > max )) && max=$i; done; echo "$max"; }
sb_s_count()   { echo "${#S_NAME[@]}"; }

# ---------------- 收藏 ----------------
sb_is_fav() {
  [[ -f "$SB_FAV_FILE" ]] && grep -qxF "$1" "$SB_FAV_FILE" 2>/dev/null
}

sb_toggle_fav() { # $1 = 全局编号
  [[ -z "$1" || "$1" == *[!0-9]* ]] && { warn "无效编号"; return; }
  local i=$(($1 - 1))
  (( i < 0 || i >= $(sb_s_count) )) && { warn "编号 $1 不存在"; return; }
  local name="${S_NAME[$i]}"
  mkdir -p "$SB_HOME"
  if sb_is_fav "$name"; then
    grep -vxF "$name" "$SB_FAV_FILE" > "${SB_FAV_FILE}.tmp" 2>/dev/null
    mv -f "${SB_FAV_FILE}.tmp" "$SB_FAV_FILE"
    ok "已取消收藏: $name"
  else
    printf '%s\n' "$name" >> "$SB_FAV_FILE"
    ok "已收藏: $name （主菜单选 f 查看）"
  fi
}

# ---------------- 自定义命令 ----------------
sb_custom_add() {
  mkdir -p "$SB_HOME"
  local n d c
  read -rp "  命令名称: " n || return
  [[ -z "$n" ]] && return
  read -rp "  说明(可空): " d || return
  read -rp "  要执行的命令: " c || return
  [[ -z "$c" ]] && { err "命令不能为空"; return; }
  [[ "$n" == *\|* || "$d" == *\|* ]] && { err "名称/说明不能包含 | 字符"; return; }
  printf '%s|%s|%s\n' "$n" "$d" "$c" >> "$SB_CUSTOM_FILE"
  ok "已添加: $n"
}

sb_custom_del() {
  [[ -z "$1" || "$1" == *[!0-9]* ]] && { warn "无效编号"; return; }
  [[ ! -s "$SB_CUSTOM_FILE" ]] && { warn "暂无自定义命令"; return; }
  local n; n="$(sed -n "${1}p" "$SB_CUSTOM_FILE" | cut -d'|' -f1)"
  [[ -z "$n" ]] && { err "编号 $1 不存在"; return; }
  sed -i.bak "${1}d" "$SB_CUSTOM_FILE" && rm -f "${SB_CUSTOM_FILE}.bak"
  ok "已删除: $n"
}

sb_custom_run() {
  [[ -z "$1" || "$1" == *[!0-9]* ]] && { warn "无效编号"; return; }
  local ln; ln="$(sed -n "${1}p" "$SB_CUSTOM_FILE" 2>/dev/null)"
  [[ -z "$ln" ]] && { err "编号 $1 不存在"; return; }
  local rest="${ln#*|}" c="${rest#*|}"
  echo
  echo -e "  ${YELLOW}将执行:${NC} $c"
  read -rp "  确认执行? [y/N] " cc
  [[ "$cc" =~ ^[Yy]$ ]] || { info "已取消"; return; }
  echo -e "${CYAN}  ────────── 执行中 (Ctrl+C 可中断) ──────────${NC}"
  bash -c "$c"
  local rc=$?
  echo; (( rc == 0 )) && ok "执行完成" || warn "执行退出码: $rc"
  read -rp "按回车返回..." _ || return
}

# ---------------- 执行脚本条目 ----------------
sb_run_entry() { # $1 = 全局编号(1-based)
  local id="$1"
  [[ -z "$id" || "$id" == *[!0-9]* ]] && { warn "无效编号"; return; }
  local i=$((id - 1))
  (( i < 0 || i >= $(sb_s_count) )) && { err "编号 $id 不存在"; return 1; }

  local name="${S_NAME[$i]}" desc="${S_DESC[$i]}" cmd="${S_CMD[$i]}"
  local flags="${S_FLAGS[$i]}" type="${S_TYPE[$i]}"

  sb_banner
  line
  echo -e "  ${BOLD}${GREEN}▶ ${name}${NC}"
  [[ -n "$desc" ]] && echo -e "  ${CYAN}${desc}${NC}"
  local tags=""
  has_flag "$flags" root        && tags="${tags}  🔑需root"
  has_flag "$flags" danger      && tags="${tags}  ⚠️危险"
  has_flag "$flags" deprecated  && tags="${tags}  💤已停更"
  [[ -n "$tags" ]] && echo -e "  标签:${tags}"
  echo
  echo -e "  ${YELLOW}── 将执行命令 (${type}) ──${NC}"
  echo "$cmd"
  line

  if has_flag "$flags" root && [[ $EUID -ne 0 ]]; then
    err "该脚本需要 root 权限，请以 root 或 sudo 运行本工具箱"
    read -rp "按回车返回..." _ || return
    return 1
  fi

  read -rp "  确认执行? [y/N] " c
  [[ "$c" =~ ^[Yy]$ ]] || { info "已取消"; return 1; }

  if has_flag "$flags" danger; then
    echo -e "  ${RED}⚠️  危险操作！可能重装系统或造成数据丢失！${NC}"
    read -rp "  请输入 yes 继续确认: " c2
    [[ "$c2" == "yes" ]] || { info "已取消"; return 1; }
  fi

  echo -e "${CYAN}  ────────── 执行中 (Ctrl+C 可中断) ──────────${NC}"
  bash -c "$cmd"
  local rc=$?
  echo
  (( rc == 0 )) && ok "执行完成" || warn "执行退出码: $rc"
  read -rp "按回车返回菜单..." _ || return
  return $rc
}

# ---------------- 菜单 ----------------
sb_menu_main() {
  if [[ ! -t 0 ]]; then
    err "标准输入不是终端，无法进入交互菜单"
    info "请使用 bash <(curl -sL 地址/spellbook.sh) 方式运行，或安装后直接运行 spellbook"
    return 1
  fi
  local max; max=$(sb_cat_count)
  while true; do
    sb_banner
    echo -e "  ${BOLD}请选择分类：${NC}\n"
    local i j cnt id
    for (( i=1; i<=max; i++ )); do
      [[ -z "${CAT_NAME[$i]:-}" ]] && continue
      cnt=0
      for (( j=0; j<${#S_CAT[@]}; j++ )); do [[ "${S_CAT[$j]}" == "$i" ]] && cnt=$((cnt+1)); done
      printf "   ${GREEN}%2d)${NC} %s %s ${CYAN}(%d)${NC}\n" "$i" "${CAT_ICON[$i]}" "${CAT_NAME[$i]}" "$cnt"
    done
    echo
    echo -e "   ${PURPLE} f)${NC} ⭐ 我的收藏        ${PURPLE} c)${NC} ✏️  自定义命令"
    echo -e "   ${PURPLE} u)${NC} 🔄 更新工具箱      ${PURPLE} i)${NC} 💾 安装到系统"
    echo -e "   ${PURPLE} a)${NC} ℹ️  关于            ${PURPLE} q)${NC} 退出"
    echo
    read -rp "   请输入选择: " ch || exit 0
    case "$ch" in
      q|Q|0) exit 0 ;;
      f|F) sb_menu_favorites ;;
      c|C) sb_menu_custom ;;
      u|U) sb_update_self; read -rp "按回车继续..." _ ;;
      i|I) sb_install_self; read -rp "按回车继续..." _ ;;
      a|A) sb_about; read -rp "按回车继续..." _ ;;
      ''|*[!0-9]*) warn "无效输入" ;;
      *)
        if (( ch >= 1 && ch <= max )) && [[ -n "${CAT_NAME[$ch]:-}" ]]; then
          sb_menu_category "$ch"
        else
          warn "无效选择"
        fi
        ;;
    esac
  done
}

sb_menu_category() {
  local ci="$1"
  while true; do
    sb_banner
    echo -e "  ${BOLD}${CAT_ICON[$ci]} ${CAT_NAME[$ci]}${NC}\n"
    local j id any=0
    for (( j=0; j<${#S_CAT[@]}; j++ )); do
      [[ "${S_CAT[$j]}" != "$ci" ]] && continue
      id=$((j + 1)); any=1
      local star="  "
      sb_is_fav "${S_NAME[$j]}" && star="⭐"
      printf "   ${GREEN}%2d)${NC} %s %s\n       ${CYAN}%s${NC}\n" "$id" "$star" "${S_NAME[$j]}" "${S_DESC[$j]}"
    done
    if [[ $any -eq 0 ]]; then
      warn "该分类暂无可用脚本"; read -rp "按回车返回..." _ || return; return
    fi
    echo -e "\n   ${CYAN}编号=执行   f编号=收藏/取消   0=返回${NC}"
    read -rp "   选择: " ch || exit 0
    case "$ch" in
      0|q|Q) return ;;
      f*) sb_toggle_fav "${ch#f}" ;;
      ''|*[!0-9]*) warn "无效输入" ;;
      *) sb_run_entry "$ch" ;;
    esac
  done
}

sb_menu_favorites() {
  while true; do
    sb_banner
    echo -e "  ${BOLD}⭐ 我的收藏${NC}\n"
    local j id any=0
    for (( j=0; j<${#S_NAME[@]}; j++ )); do
      sb_is_fav "${S_NAME[$j]}" || continue
      id=$((j + 1)); any=1
      printf "   ${GREEN}%2d)${NC} %s\n       ${CYAN}%s${NC}\n" "$id" "${S_NAME[$j]}" "${S_DESC[$j]}"
    done
    if [[ $any -eq 0 ]]; then
      echo -e "   ${YELLOW}还没有收藏。在分类菜单中输入 f编号 即可收藏。${NC}"
      read -rp "按回车返回..." _ || return; return
    fi
    echo -e "\n   ${CYAN}编号=执行   f编号=取消收藏   0=返回${NC}"
    read -rp "   选择: " ch || exit 0
    case "$ch" in
      0|q|Q) return ;;
      f*) sb_toggle_fav "${ch#f}" ;;
      ''|*[!0-9]*) warn "无效输入" ;;
      *) sb_run_entry "$ch" ;;
    esac
  done
}

sb_menu_custom() {
  while true; do
    sb_banner
    echo -e "  ${BOLD}✏️  自定义命令${NC}   ${CYAN}${SB_CUSTOM_FILE}${NC}\n"
    if [[ ! -s "$SB_CUSTOM_FILE" ]]; then
      echo -e "   ${YELLOW}暂无自定义命令，选 a 添加。${NC}"
    else
      local k=1 ln n rest d c
      while IFS= read -r ln; do
        [[ -z "$ln" ]] && continue
        n="${ln%%|*}"; rest="${ln#*|}"; d="${rest%%|*}"; c="${rest#*|}"
        printf "   ${GREEN}%2d)${NC} %s ${CYAN}%s${NC}\n       %s\n" "$k" "$n" "$d" "$c"
        k=$((k+1))
      done < "$SB_CUSTOM_FILE"
    fi
    echo -e "\n   ${CYAN}编号=执行   a=添加   d编号=删除   0=返回${NC}"
    read -rp "   选择: " ch || exit 0
    case "$ch" in
      0|q|Q) return ;;
      a|A) sb_custom_add ;;
      d*) sb_custom_del "${ch#d}" ;;
      ''|*[!0-9]*) warn "无效输入" ;;
      *) sb_custom_run "$ch" ;;
    esac
  done
}

# ---------------- 安装 / 更新 / 信息 ----------------
sb_install_self() {
  local self
  self="$(readlink -f "$0" 2>/dev/null || echo "$0")"
  case "$self" in
    /dev/fd/*|/proc/self/fd/*)
      warn "检测到通过管道方式运行，无法直接安装"
      info "请先执行: bash <(curl -sL ...) update   或下载后运行: bash spellbook.sh install"
      return 1 ;;
  esac
  if [[ $EUID -ne 0 ]]; then
    err "需要 root 权限写入 $SB_INSTALL_TARGET"
    info "请使用: sudo bash $self install"
    return 1
  fi
  cp -f "$self" "$SB_INSTALL_TARGET" && chmod +x "$SB_INSTALL_TARGET" \
    && ok "已安装: $SB_INSTALL_TARGET ，现在可以直接使用 spellbook 命令" \
    || { err "安装失败"; return 1; }
}

sb_update_self() {
  local url; url="$(sb_b64d "$SB_URL_B64")"
  if [[ -z "$url" ]]; then
    err "本脚本未内嵌来源地址（本地模式生成），无法自更新"
    return 1
  fi
  local tmp="/tmp/spellbook.$$.sh"
  info "正在获取最新版本: $url/spellbook.sh"
  sb_fetch "$url/spellbook.sh" > "$tmp" || { err "下载失败，请检查网络"; rm -f "$tmp"; return 1; }
  bash -n "$tmp" || { err "新脚本语法校验失败，已放弃更新"; rm -f "$tmp"; return 1; }
  if [[ $EUID -eq 0 && -d /usr/local/bin ]]; then
    cp -f "$tmp" "$SB_INSTALL_TARGET" && chmod +x "$SB_INSTALL_TARGET"
    ok "已更新 $SB_INSTALL_TARGET （重新运行 spellbook 生效）"
  else
    mkdir -p "$SB_HOME"
    cp -f "$tmp" "$SB_HOME/spellbook.sh"
    ok "无 root 权限，最新版已保存到 $SB_HOME/spellbook.sh"
    info "手动安装: sudo bash $SB_HOME/spellbook.sh install"
  fi
  rm -f "$tmp"
}

sb_list() {
  echo -e "${BOLD}收录脚本一览（编号即直达参数）:${NC}\n"
  local max i j id
  max=$(sb_cat_count)
  for (( i=1; i<=max; i++ )); do
    [[ -z "${CAT_NAME[$i]:-}" ]] && continue
    echo -e "${BOLD}  [${CAT_ICON[$i]} ${CAT_NAME[$i]}]${NC}"
    for (( j=0; j<${#S_CAT[@]}; j++ )); do
      [[ "${S_CAT[$j]}" != "$i" ]] && continue
      id=$((j+1))
      printf "    %3d) %s — %s\n" "$id" "${S_NAME[$j]}" "${S_DESC[$j]}"
    done
    echo
  done
}

sb_search() {
  local kw="$1"
  [[ -z "$kw" ]] && { err "用法: spellbook search 关键词"; return 1; }
  local up="${kw^^}"
  echo -e "搜索 \"${BOLD}${kw}${NC}\"：\n"
  local j id found=0
  for (( j=0; j<${#S_NAME[@]}; j++ )); do
    if [[ "${S_NAME[$j]^^}" == *"$up"* || "${S_DESC[$j]^^}" == *"$up"* ]]; then
      id=$((j+1)); found=1
      printf "  ${GREEN}%3d)${NC} [%s] %s\n        ${CYAN}%s${NC}\n" "$id" "${CAT_NAME[${S_CAT[$j]}]:-?}" "${S_NAME[$j]}" "${S_DESC[$j]}"
    fi
  done
  [[ $found -eq 0 ]] && warn "没有匹配项"
  return 0
}

sb_about() {
  sb_banner
  echo "  版本: $(sb_b64d "$SB_VERSION_B64")"
  echo "  生成时间: {{GENERATED_AT}}"
  echo "  来源: $(sb_b64d "$SB_URL_B64")/spellbook.sh"
  echo "  收录: $(sb_s_count) 个脚本 / $(sb_cat_count) 个分类"
  echo
  echo "  用浏览器打开来源地址即可进入管理端编辑本工具箱内容，"
  echo "  修改后在 VPS 上执行 spellbook update 即可同步。"
}

sb_usage() {
  echo "用法: spellbook [命令]"
  echo "  (无参数)      打开交互菜单"
  echo "  install       安装到 /usr/local/bin/spellbook"
  echo "  update        从来源地址更新"
  echo "  list          列出全部脚本"
  echo "  search <词>   搜索脚本"
  echo "  about         关于"
  echo "  <编号>        直接执行对应脚本"
}

# ---------------- 入口 ----------------
sb_main() {
  if [[ -z "${BASH_VERSION:-}" ]]; then
    echo "请使用 bash 运行本脚本" >&2
    exit 1
  fi
  if (( BASH_VERSINFO[0] < 4 )); then
    echo "需要 bash 4.0 及以上版本" >&2
    exit 1
  fi
  sb_parse_data
  case "${1:-}" in
    "")          sb_menu_main ;;
    install)     sb_install_self ;;
    update)      sb_update_self ;;
    list|l)      sb_list ;;
    search|s)    sb_search "${2:-}" ;;
    about|a)     sb_about ;;
    ''|*[!0-9]*) sb_usage ;;
    *)
      local cnt; cnt=$(sb_s_count)
      if (( $1 >= 1 && $1 <= cnt )); then
        sb_run_entry "$1"
      else
        err "编号 $1 不存在"
        sb_usage
      fi
      ;;
  esac
}

sb_main "$@"
