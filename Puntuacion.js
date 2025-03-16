function mostrarMejoresPuntuaciones() {
    // Obtener los datos desde el localStorage
    let puntuaciones = JSON.parse(localStorage.getItem('jugadores')) || [];

    // Ordenar las puntuaciones de mayor a menor
    puntuaciones.sort((a, b) => b.punt - a.punt);

    // Limitar a las 10 mejores puntuaciones
    puntuaciones = puntuaciones.slice(0, 7);

    let scoreContainer = document.getElementById('tabla-puntuaciones');
            scoreContainer.innerHTML = `<h3>Puntuaciones</h3>
                                <table class="table table-dark">
                                    <thead>
                                        <tr>
                                            <th class="fs-2">Nombre</th>
                                            <th class="fs-2">Puntuación</th>
                                            <th class="fs-2">Fecha de Registro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    ${puntuaciones.map(player => `
                                        <tr class="fs-4">
                                            <td>${player.nom}</td>
                                            <td>${player.punt}</td>
                                            <td>${player.date || 'N/A'}</td> <!-- Mostrar 'N/A' si no tiene fecha -->
                                        </tr>`).join('')}
                                    </tbody>
                                </table>`;
   
}