export const agendaDate = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
export const agendaDateTime = (value: string) => new Date(value).toLocaleString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short',
});
export const agendaToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date());
