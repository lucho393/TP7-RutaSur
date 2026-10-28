
import Link from "next/link";
import { getDatabase } from "../../../lib/mongodb";
import ActualizacionEnVivo from "../../components/ActualizacionEnVivo";
import styles from "./detalle.module.css";

export const instant = false;

function mostrarFecha(fecha) {
    if (!fecha) return "-";

    const valor = new Date(fecha);

    return Number.isNaN(valor.getTime())
        ? "-"
        : valor.toLocaleString("es-AR");
}

export default async function DetalleEnvio({ params }) {
    const { id } = await params;
    const db = await getDatabase();

    const [envio, alertas, notificaciones] = await Promise.all([
        db.collection("envios").findOne({ shipmentId: id }),
        db.collection("alertas").find({ shipmentId: id }).toArray(),
        db.collection("notificaciones").find({ shipmentId: id }).toArray(),
    ]);

    if (!envio) {
        return (
            <main className={styles.contenedor}>
                <ActualizacionEnVivo shipmentId={id} />
                <Link href="/" className={styles.volver}>
                    ← Volver a Torre de control
                </Link>
                <h1>Envío no encontrado</h1>
                <p>No existe el envío {id}.</p>
            </main>
        );
    }

    const historial = [...(envio.historial || [])].sort(
        (a, b) => (a.secuencia || 0) - (b.secuencia || 0)
    );

    return (
        <main className={styles.contenedor}>
            <ActualizacionEnVivo shipmentId={id} />

            <Link href="/" className={styles.volver}>
                ← Volver a Torre de control
            </Link>

            <header className={styles.encabezado}>
                <span className={styles.subtitulo}>SEGUIMIENTO LOGÍSTICO</span>
                <h1>Detalle del envío</h1>
                <p>Información y movimientos del paquete</p>
            </header>

            <section className={styles.resumen}>
                <div>
                    <span className={styles.etiqueta}>NÚMERO DE SEGUIMIENTO</span>
                    <p className={styles.identificador}>{envio.shipmentId}</p>
                </div>

                <div>
                    <span className={styles.etiqueta}>ESTADO ACTUAL</span>
                    <p>
                        <span className={styles.estado}>
                            {envio.estado || "SIN ESTADO"}
                        </span>
                    </p>
                </div>

                <div>
                    <span className={styles.etiqueta}>ÚLTIMA ACTUALIZACIÓN</span>
                    <p className={styles.valor}>
                        {mostrarFecha(envio.actualizadoEn)}
                    </p>
                </div>
            </section>

            <section className={styles.seccion}>
                <h2>Línea de tiempo</h2>

                <div className={styles.panel}>
                    {historial.length === 0 ? (
                        <p>No hay eventos registrados.</p>
                    ) : (
                        <ol className={styles.timeline}>
                            {historial.map((evento, indice) => (
                                <li
                                    key={evento.eventId || indice}
                                    className={styles.evento}
                                >
                                    <div className={styles.punto}></div>

                                    <div className={styles.eventoContenido}>
                                        <strong>{evento.tipo}</strong>
                                        <span>{mostrarFecha(evento.ocurridoEn)}</span>
                                        <small>Secuencia {evento.secuencia ?? "-"}</small>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </section>

            <section className={styles.seccion}>
                <h2>Intentos de entrega</h2>

                <div className={styles.panel}>
                    {(envio.intentos || []).length === 0 ? (
                        <p>No hay intentos registrados.</p>
                    ) : (
                        <ul className={styles.lista}>
                            {envio.intentos.map((intento, indice) => (
                                <li key={indice}>
                                    <strong>
                                        Intento {intento.intento ?? indice + 1}
                                    </strong>
                                    <span>Motivo: {intento.motivo || "-"}</span>
                                    <span>
                                        Fecha: {mostrarFecha(intento.ocurridoEn)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className={styles.seccion}>
                <h2>Alertas del envío</h2>

                <div className={styles.panel}>
                    {alertas.length === 0 ? (
                        <p>No hay alertas registradas.</p>
                    ) : (
                        <ul className={styles.lista}>
                            {alertas.map((alerta) => (
                                <li key={String(alerta._id)}>
                                    <strong>{alerta.regla || "Alerta"}</strong>
                                    <span>
                                        Prioridad: {alerta.prioridad || "Sin prioridad"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className={styles.seccion}>
                <h2>Notificaciones del envío</h2>

                <div className={styles.panel}>
                    {notificaciones.length === 0 ? (
                        <p>No hay notificaciones registradas.</p>
                    ) : (
                        <ul className={styles.lista}>
                            {notificaciones.map((notificacion) => (
                                <li key={String(notificacion._id)}>
                                    <strong>
                                        {notificacion.tipo || "Notificación"}
                                    </strong>
                                    <span>
                                        {mostrarFecha(
                                            notificacion.ocurridoEn ||
                                            notificacion.enviadoEn
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
