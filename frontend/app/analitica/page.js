
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./analitica.module.css";

export default function Analitica() {
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);

    const [zonaId, setZonaId] = useState("");
    const [hubId, setHubId] = useState("");
    const [fecha, setFecha] = useState("");

    useEffect(() => {
        async function cargarDatos() {
            setCargando(true);

            try {
                const parametros = new URLSearchParams();

                if (zonaId) parametros.set("zonaId", zonaId);
                if (hubId) parametros.set("hubId", hubId);
                if (fecha) parametros.set("fecha", fecha);

                const respuesta = await fetch(
                    `/api/analitica?${parametros.toString()}`,
                    { cache: "no-store" }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar los indicadores");
                }

                const resultado = await respuesta.json();

                setDatos(resultado);
                setError("");
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarDatos();
    }, [zonaId, hubId, fecha]);

    const porcentaje = (valor) =>
        `${Number(valor || 0).toFixed(1)}%`;

    return (
        <main className={styles.contenedor}>
            <Link href="/" className={styles.volver}>
                ← Volver a Torre de control
            </Link>

            <header className={styles.encabezado}>
                <span className={styles.subtitulo}>ESTADÍSTICAS LOGÍSTICAS</span>
                <h1>RutaSur | Analítica</h1>
                <p>Indicadores de rendimiento y seguimiento de operaciones</p>
            </header>

            <section className={styles.seccion}>
                <h2>Filtros de consulta</h2>

                <div className={styles.filtros}>
                    <label>
                        Zona
                        <select
                            value={zonaId}
                            onChange={(e) => setZonaId(e.target.value)}
                        >
                            <option value="">Todas las zonas</option>
                            {(datos?.filtros?.zonas || []).map((zona) => (
                                <option key={zona} value={zona}>{zona}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Hub
                        <select
                            value={hubId}
                            onChange={(e) => setHubId(e.target.value)}
                        >
                            <option value="">Todos los hubs</option>
                            {(datos?.filtros?.hubs || []).map((hub) => (
                                <option key={hub} value={hub}>{hub}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Fecha
                        <select
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        >
                            <option value="">Todas las fechas</option>
                            {(datos?.filtros?.fechas || []).map((dia) => (
                                <option key={dia} value={dia}>{dia}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            {cargando && <p>Cargando indicadores...</p>}
            {error && <p className={styles.error}>{error}</p>}

            {!cargando && datos && (
                <>
                    <section className={styles.seccion}>
                        <h2>Indicadores principales</h2>

                        <div className={styles.tarjetas}>
                            <div className={styles.tarjeta}>
                                <span>ENTREGA EN PRIMER INTENTO</span>
                                <strong>
                                    {porcentaje(datos.indicadores.tasaPrimerIntento)}
                                </strong>
                                <small>Efectividad de las primeras entregas</small>
                            </div>

                            <div className={styles.tarjeta}>
                                <span>CUMPLIMIENTO DE SLA</span>
                                <strong>
                                    {datos.indicadores.entregasEvaluadasSLA > 0
                                        ? porcentaje(datos.indicadores.cumplimientoSLA)
                                        : "Sin datos"}
                                </strong>
                                <small>Entregas dentro del plazo establecido</small>
                            </div>
                        </div>
                    </section>

                    <section className={styles.seccion}>
                        <h2>Distribución de motivos de fallo</h2>

                        <div className={styles.panel}>
                            {Object.keys(datos.indicadores.motivos).length === 0 ? (
                                <p>No hay fallos registrados.</p>
                            ) : (
                                <div className={styles.tablaContenedor}>
                                    <table className={styles.tabla}>
                                        <thead>
                                            <tr>
                                                <th>Motivo</th>
                                                <th>Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(datos.indicadores.motivos).map(
                                                ([motivo, cantidad]) => (
                                                    <tr key={motivo}>
                                                        <td>{motivo}</td>
                                                        <td>{cantidad}</td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className={styles.seccion}>
                        <h2>Tiempo medio de permanencia en hub</h2>
                        <p className={styles.descripcion}>
                            Indicador obtenido mediante reprocesamiento histórico
                            de eventos de Kafka.
                        </p>

                        <div className={styles.panel}>
                            {!datos.tiemposHub || datos.tiemposHub.length === 0 ? (
                                <p>
                                    Todavía no hay datos de reprocesamiento histórico.
                                </p>
                            ) : (
                                <div className={styles.tablaContenedor}>
                                    <table className={styles.tabla}>
                                        <thead>
                                            <tr>
                                                <th>Hub</th>
                                                <th>Envíos procesados</th>
                                                <th>Tiempo promedio (minutos)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {datos.tiemposHub.map((hub) => (
                                                <tr key={hub.hubId}>
                                                    <td>{hub.hubId}</td>
                                                    <td>{hub.cantidadEnvios}</td>
                                                    <td>
                                                        {hub.cantidadEnvios > 0
                                                            ? (
                                                                hub.totalMinutos / hub.cantidadEnvios
                                                            ).toFixed(2)
                                                            : "0.00"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className={styles.seccion}>
                        <h2>Métricas por fecha, zona, hub y franja</h2>

                        <div className={styles.panel}>
                            {datos.metricas.length === 0 ? (
                                <p>No hay métricas para los filtros seleccionados.</p>
                            ) : (
                                <div className={styles.tablaContenedor}>
                                    <table className={styles.tabla}>
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Zona</th>
                                                <th>Hub</th>
                                                <th>Franja</th>
                                                <th>Primeros intentos</th>
                                                <th>Entregados primer intento</th>
                                                <th>SLA cumplidos</th>
                                                <th>SLA incumplidos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {datos.metricas.map((metrica, indice) => (
                                                <tr key={indice}>
                                                    <td>{metrica.fecha}</td>
                                                    <td>{metrica.zonaId}</td>
                                                    <td>{metrica.hubId}</td>
                                                    <td>{metrica.franja}</td>
                                                    <td>{metrica.primerosIntentos || 0}</td>
                                                    <td>{metrica.entregadosPrimerIntento || 0}</td>
                                                    <td>{metrica.cumplidosSLA || 0}</td>
                                                    <td>{metrica.incumplidosSLA || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}
