import type { Dict } from "./en";

const es: Dict = {
  // Landing
  landing_headline: "Planifica tu semana.",
  landing_subtitle: "Ve tu semana, añade tareas, completa cosas.",
  landing_cta: "Abrir planificador",

  // Login
  login_subtitle: "Ve tu semana, añade tareas, completa cosas.",
  login_signing_in: "Iniciando sesión…",
  login_google: "Continuar con Google",
  login_no_account: "No necesitas cuenta — Google sign-in crea una.",
  login_error_default: "Error al iniciar sesión. Inténtalo de nuevo.",
  login_error_generic: "Algo salió mal. Inténtalo de nuevo.",

  // Nav
  nav_dashboard: "Inicio",
  nav_agenda: "Agenda",
  nav_teams: "Equipos",

  // Topbar
  topbar_sign_out: "Cerrar sesión",

  // Common
  cancel: "Cancelar",
  save: "Guardar",
  create: "Crear",
  creating: "Creando…",
  saving: "Guardando…",
  close: "Cerrar",
  ok: "OK",
  all: "Todo",

  // Task Overview
  overview_title: "Tareas",
  overview_for_today: "{n} para hoy",
  overview_add_task: "+ Añadir tarea",
  overview_today: "Hoy",
  overview_tomorrow: "Mañana",
  overview_nothing_planned: "Nada planificado aún.",
  overview_add_first: "Añade tu primera tarea",
  overview_past: "Pasado",
  overview_overdue: "{n} atrasada{s}",
  task_overdue_badge: "{n}d de atraso",

  // Today hero
  hero_quick_add_placeholder: "Añade una tarea para hoy…",
  hero_add_button: "Añadir",
  hero_task_count: "{n} tareas",
  hero_empty_today: "Nada planificado para hoy.",
  hero_quick_add_error: "No se pudo añadir la tarea. Inténtalo de nuevo.",

  // Overdue banner
  overdue_banner_message: "{n} tareas atrasadas",
  overdue_banner_action: "Mover todo a hoy",
  overdue_banner_moving: "Moviendo…",
  overdue_banner_success: "Se movieron {n} tareas a hoy",
  overdue_banner_partial_error: "No se pudieron mover {n} — inténtalo de nuevo",

  // Assigned to you (team tasks)
  assigned_section_title: "Asignadas a ti",

  // Week View
  week_prev: "Semana anterior",
  week_next: "Semana siguiente",
  week_today: "Hoy",
  week_view_week: "Semana",
  week_view_month: "Mes",
  week_new_category: "+ Categoría",
  week_category_name_placeholder: "Nombre de categoría",
  week_prev_day: "Día anterior",
  week_next_day: "Día siguiente",

  // Day Column
  day_nothing_planned: "Nada planificado",
  day_add_task: "+ Añadir tarea",

  // Month View
  month_prev: "Mes anterior",
  month_next: "Mes siguiente",
  month_add_task: "+ añadir tarea",
  month_task_deleted: "Tarea eliminada",

  // Undated
  no_date: "Sin fecha",
  undated_section: "Sin fecha",
  add_task_no_date: "Sin fecha",
  add_task_set_date: "Añadir fecha",

  // Add Task Modal
  add_task_heading: "Añadir tarea",
  add_task_event_heading: "Añadir evento",
  add_task_type_task: "Tarea",
  add_task_type_event: "Evento",
  add_task_title_placeholder: "¿Qué hay que hacer?",
  add_task_event_title_placeholder: "ej. Cumpleaños de Sara",
  add_task_label_title: "Título",
  add_task_label_category: "Categoría",
  add_task_label_date: "Fecha",
  add_task_label_time: "Hora (opcional)",
  add_task_new_category: "Nueva categoría",
  add_task_category_name: "Nombre de categoría",
  add_task_repeat: "Repetir esta tarea",
  add_task_every: "Cada",
  add_task_days: "día(s)",
  add_task_weeks: "semana(s)",
  add_task_months: "mes(es)",
  add_task_years: "año(s)",
  add_task_until_date: "Hasta fecha",
  add_task_after_n: "Después de N veces",
  add_task_times: "veces",
  add_task_label_notes: "Notas",
  add_task_notes_placeholder: "Detalles adicionales…",

  // Edit Task Modal
  edit_task_heading: "Editar tarea",
  edit_task_label_title: "Título",
  edit_task_label_category: "Categoría",
  edit_task_label_date: "Fecha",
  edit_task_label_time: "Hora (opcional)",
  edit_task_label_notes: "Notas",

  // Edit Series Modal
  edit_series_heading: "Editar todas las ocurrencias",
  edit_series_subtitle: "Los cambios se aplican a todas las ocurrencias futuras",
  edit_series_save: "Guardar todo",

  // Task Detail Modal
  task_detail_undo: "Deshacer",
  task_detail_done: "Hecho",
  task_detail_edit: "Editar",
  task_detail_no_notes: "Sin notas",

  // Task Item
  task_mark_incomplete: "Marcar incompleta",
  task_mark_complete: "Marcar completa",
  task_event: "Evento",
  task_recurring: "Recurrente",
  task_updated: "Tarea actualizada",
  task_added: "Tarea añadida",
  task_event_added: "Evento añadido",
  task_recurring_created: "Tarea recurrente creada",
  task_deleted: "Tarea eliminada",
  task_occurrence_deleted: "Ocurrencia eliminada",
  task_series_cancelled: "Tarea recurrente cancelada",
  task_edit: "Editar tarea",
  task_delete: "Eliminar tarea",
  task_duplicate: "Duplicar tarea",
  task_duplicated: "Tarea duplicada",

  // Recurring Dialog
  recurring_title: "Tarea recurrente",
  recurring_edit_q: "¿Quieres editar solo esta ocurrencia o todas las futuras?",
  recurring_delete_q: "¿Quieres eliminar solo esta ocurrencia o cancelar toda la serie?",
  recurring_this: "Esta ocurrencia",
  recurring_this_note: "— solo esta",
  recurring_all: "Todas las ocurrencias",
  recurring_cancel_series: "Cancelar serie",
  recurring_all_note: "— afecta a todas las futuras",

  // Category
  cat_no_category: "Sin categoría",
  cat_new: "+ Nueva categoría…",
  cat_rename: "Renombrar",
  cat_remove: "Eliminar",
  cat_renamed: "Categoría renombrada",
  cat_deleted: "Categoría eliminada",
  cat_created: "Categoría creada",

  // Teams list
  teams_title: "Equipos",
  teams_new: "Nuevo equipo",
  teams_none: "Sin equipos aún",
  teams_none_subtitle: "Crea un equipo para colaborar con otros.",
  teams_create: "Crear equipo",
  teams_members: "{n} miembro{s}",
  teams_name_label: "Nombre del equipo",
  teams_name_placeholder: "ej. Equipo de producto",

  // Team Detail
  team_tab_tasks: "Tareas",
  team_tab_settings: "Ajustes",
  team_members_header: "Miembros ({n})",
  team_settings_general: "General",
  team_settings_name: "Nombre del equipo",
  team_settings_rename: "Renombrar equipo",
  team_settings_save_name: "Guardar nombre",
  team_settings_people: "Personas",
  team_settings_role_admin: "Admin",
  team_settings_role_member: "Miembro",
  team_settings_invite_links: "Links de invitación",
  team_settings_new_link: "Nuevo link",
  team_settings_max_uses: "Usos máximos",
  team_settings_expires: "Expira el (opcional)",
  team_settings_create_link: "Crear link",
  team_settings_no_links: "Sin links de invitación aún.",
  team_settings_expired: "expirado",
  team_settings_copy: "Copiar link",
  team_settings_revoke: "Revocar link",
  team_settings_integrations: "Integraciones",
  team_settings_discord: "Discord",
  team_settings_discord_connected: "El bot está conectado a tu servidor.",
  team_settings_discord_add: "Añade el bot para activar recordatorios en canales.",
  team_settings_discord_guild: "Servidor {id}",
  team_settings_connected: "Conectado",
  team_settings_disconnect: "Desconectar",
  team_settings_disconnecting: "Desconectando…",
  team_settings_add_discord: "Añadir a Discord",
  team_settings_danger: "Eliminar este equipo",
  team_settings_danger_subtitle: "Elimina permanentemente el equipo y todos sus miembros.",
  team_settings_deleting: "Eliminando…",
  team_settings_delete: "Eliminar equipo",

  // Team Tasks section
  team_tasks_add: "Añadir tarea",
  team_tasks_no_one: "Nadie",
  team_tasks_empty: "Sin tareas aún. Añade una para empezar.",
  team_tasks_empty_filter: "Ninguna tarea coincide con este filtro.",
  team_tasks_count: "Tareas ({n})",

  // Team Task Modal
  team_task_edit_heading: "Editar tarea",
  team_task_add_heading: "Añadir tarea",
  team_task_edit_event_heading: "Editar evento",
  team_task_add_event_heading: "Añadir evento",
  team_task_type_task: "Tarea",
  team_task_type_event: "Evento",
  team_task_event_added: "Evento añadido",
  team_task_label_title: "Título",
  team_task_title_placeholder: "¿Qué hay que hacer?",
  team_task_event_title_placeholder: "ej. 4 de julio",
  team_task_label_date: "Fecha",
  team_task_label_assign: "Asignar a (opcional)",
  team_task_unassigned: "Sin asignar",
  team_task_unknown: "Desconocido",
  team_task_label_category: "Categoría (opcional)",
  team_task_no_category: "Sin categoría",
  team_task_label_notes: "Notas (opcional)",
  team_task_notes_placeholder: "Detalles adicionales…",

  // Team Task Detail
  team_task_detail_undo: "Deshacer",
  team_task_detail_done: "Hecho",
  team_task_detail_edit: "Editar",
  team_task_detail_no_notes: "Sin notas",

  // Team Categories
  team_cat_title: "Categorías",
  team_cat_new: "Nueva",
  team_cat_empty: "Sin categorías aún. Crea una para organizar las tareas.",
  team_cat_empty_short: "Sin categorías aún.",
  team_cat_label_name: "Nombre",
  team_cat_discord_channel: "Canal de Discord (opcional)",
  team_cat_no_channel: "Sin canal",
  team_cat_connect_discord: "Conecta Discord en ajustes del equipo",
  team_cat_label_reminder: "Recordatorio",
  team_cat_no_reminder: "Ninguno",
  team_cat_1h: "1 hora antes",
  team_cat_24h: "24 horas antes",
  team_cat_72h: "72 horas antes",

  // Invite page
  invite_loading: "Cargando invitación…",
  invite_invited_to: "Has sido invitado/a a",
  invite_accept: "Aceptar invitación",
  invite_joining: "Uniéndose…",
  invite_joined: "¡Te uniste a {name}!",
  invite_redirecting: "Redirigiendo…",
  invite_expired_title: "Invitación expirada",
  invite_expired_body: "Este link ha expirado o alcanzó el número máximo de usos.",
  invite_invalid_title: "Invitación inválida",
  invite_invalid_body: "Este link de invitación no existe.",
  invite_error_title: "Algo salió mal",
  invite_error_body: "No se pudo cargar esta invitación. Por favor intenta de nuevo.",
  invite_retry: "Reintentar",
  invite_go_dashboard: "Ir al inicio",
  invite_error_join: "Algo salió mal. Inténtalo de nuevo.",

  // Days (short, 1-letter, long)
  days_short: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  days_letter: ["L", "M", "X", "J", "V", "S", "D"],
  days_long: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],

  // Months
  months: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
};

export default es;
