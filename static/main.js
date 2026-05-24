const ENDPOINTS = {
    nodes: '/nodes',
    kubernetes: '/tuppr/kubernetes',
    talos: '/tuppr/talos'
};

const REFRESH_INTERVAL_MS = 60 * 1000;
let refreshTimer = null;

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return date.toLocaleString('utc');
}

function statusClass(phase) {
    const normalized = String(phase || '').toLowerCase();

    if (normalized === 'completed' || normalized === 'ready' || normalized === 'true') return 'status-completed';
    if (normalized === 'healthchecking' || normalized === 'running' || normalized.includes('progress')) return 'status-healthchecking';
    if (normalized === 'failed' || normalized === 'error' || normalized === 'false' || normalized === 'notready') return 'status-failed';
    if (normalized === 'pending' || normalized === 'waiting') return 'status-warning';

    return 'status-unknown';
}

function phaseBadge(phase) {
    const safePhase = escapeHtml(phase || 'Unknown');
    return `<span class="d-inline-flex align-items-center"><span class="status-dot ${statusClass(phase)}"></span>${safePhase}</span>`;
}

function renderNodes(nodes) {
    $('#nodeCount').text(nodes.length);
    $('#readyNodeCount').text(nodes.filter(node => node.status === true).length);

    if (!nodes.length) {
        $('#nodesTable').html('<tr><td colspan="6" class="text-muted">No nodes found.</td></tr>');
        return;
    }

    const rows = nodes.map((node) => {
        const readyLabel = node.status === true ? 'Ready' : 'Not Ready';
        const readyClass = node.status === true ? 'text-success' : 'text-danger';

        const labels = node.labels || {};

        const hiddenPrefixes = [

        ];

        const hiddenExact = [

        ];

        const visibleLabels = Object.entries(labels)
            .filter(([key]) => {
                if (hiddenExact.includes(key)) return false;
                return !hiddenPrefixes.some(prefix => key.startsWith(prefix));
            });

        const labelsHtml = visibleLabels.length
            ? visibleLabels.map(([key, value]) => {
                const shortKey = key
                    .replace('node-role.kubernetes.io/', '')
                    .replace('kubernetes.io/', '');

                return `
                <span class="node-label-pill">
                    ${escapeHtml(shortKey)}${value ? `=${escapeHtml(value)}` : ''}
                </span>
            `;
            }).join('')
            : '<span class="text-muted small">No labels</span>';

        return `
        <tr>
            <td style="min-width: 340px;">
                <div class="fw-semibold mono">${escapeHtml(node.name)}</div>
                <div class="node-labels mt-1">
                    ${labelsHtml}
                </div>
            </td>
            <td><span class="${readyClass}">${phaseBadge(readyLabel)}</span></td>
            <td><span class="badge text-bg-secondary">${escapeHtml(node.roles || 'unknown')}</span></td>
            <td class="mono">${escapeHtml(node.version || '-')}</td>
            <td class="mono small">${escapeHtml(node.os_image || '-')}</td>
            <td class="mono small">${escapeHtml(node.kernel || '-')}</td>
            <td class="mono small">${escapeHtml(node.runtime || '-')}</td>
        </tr>
    `;
    }).join('');

    $('#nodesTable').html(rows);
}

function renderKubernetesUpgrade(data) {
    const items = data.items || [];

    if (!items.length) {
        $('#k8sTargetVersion').text('-');
        $('#kubernetesUpgradeBox').html('<div class="text-muted">No KubernetesUpgrade found.</div>');
        return;
    }

    const item = items[0];
    const spec = item.spec || {};
    const status = item.status || {};
    const targetVersion = status.targetVersion || spec.kubernetes?.version || '-';

    $('#k8sTargetVersion').text(targetVersion);

    const history = status.history || [];
    const historyHtml = history.length
        ? history.map(entry => `
            <tr>
              <td>${phaseBadge(entry.phase)}</td>
              <td class="mono">${escapeHtml(entry.toVersion || '-')}</td>
              <td>${formatDate(entry.startedAt)}</td>
              <td>${formatDate(entry.completedAt)}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="4" class="text-muted">No History Available.</td></tr>';

    $('#kubernetesUpgradeBox').html(`
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <h6 class="mb-1 mono">${escapeHtml(item.metadata?.name || 'kubernetes')}</h6>
              <div>${phaseBadge(status.phase)}</div>
            </div>
            <span class="badge text-bg-primary mono">${escapeHtml(targetVersion)}</span>
          </div>
        </div>

        <dl class="row mb-3 small">
          <dt class="col-5 text-muted">Current version</dt>
          <dd class="col-7 mono">${escapeHtml(status.currentVersion || '-')}</dd>

          <dt class="col-5 text-muted">Target</dt>
          <dd class="col-7 mono">${escapeHtml(targetVersion)}</dd>

          <dt class="col-5 text-muted">Retries</dt>
          <dd class="col-7">${escapeHtml(status.retries ?? 0)}</dd>

          <dt class="col-5 text-muted">Last refreshed</dt>
          <dd class="col-7">${formatDate(status.lastUpdated)}</dd>
        </dl>

        <div class="alert alert-light border small mb-3">
          ${escapeHtml(status.message || 'No status message available.')}
        </div>

        <h6 class="mb-2">History</h6>
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Target</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>${historyHtml}</tbody>
          </table>
        </div>
      `);
}

function renderTalosUpgrades(data) {
    const items = data.items || [];

    const firstTarget = items.find(item => item.spec?.talos?.version)?.spec?.talos?.version || '-';
    $('#talosTargetVersion').text(firstTarget);

    if (!items.length) {
        $('#talosUpgradeBox').html('<div class="text-muted">No TalosUpgrades found.</div>');
        return;
    }

    const cards = items.map(item => {
        const spec = item.spec || {};
        const status = item.status || {};
        const selector = spec.nodeSelector?.matchLabels
            ? Object.entries(spec.nodeSelector.matchLabels).map(([key, value]) => `${key}=${value}`).join(', ')
            : 'all nodes / empty selector';

        const completedNodes = status.completedNodes || [];
        const failedNodes = status.failedNodes || [];
        const history = status.history || [];

        const historyHtml = history.length
            ? history.map(entry => `
              <tr>
                <td>${phaseBadge(entry.phase)}</td>
                <td class="mono">${escapeHtml(entry.toVersion || '-')}</td>
                <td>${formatDate(entry.startedAt)}</td>
                <td>${formatDate(entry.completedAt)}</td>
              </tr>
            `).join('')
            : '<tr><td colspan="4" class="text-muted">No History Available.</td></tr>';

        return `
          <div class="border rounded-4 p-3 mb-3 bg-white">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h6 class="mb-1 mono">${escapeHtml(item.metadata?.name || '-')}</h6>
                <div>${phaseBadge(status.phase)}</div>
              </div>
              <span class="badge text-bg-primary mono">${escapeHtml(spec.talos?.version || '-')}</span>
            </div>

            <dl class="row mb-3 small">
              <dt class="col-5 text-muted">Selector</dt>
              <dd class="col-7 mono">${escapeHtml(selector)}</dd>

              <dt class="col-5 text-muted">Parallelism</dt>
              <dd class="col-7">${escapeHtml(spec.parallelism ?? '-')}</dd>

              <dt class="col-5 text-muted">Current node</dt>
              <dd class="col-7 mono">${escapeHtml(status.currentNode || '-')}</dd>

              <dt class="col-5 text-muted">Completed</dt>
              <dd class="col-7">${completedNodes.length}</dd>

              <dt class="col-5 text-muted">Failed</dt>
              <dd class="col-7 ${failedNodes.length ? 'text-danger fw-semibold' : ''}">${failedNodes.length}</dd>

              <dt class="col-5 text-muted">Last refreshed</dt>
              <dd class="col-7">${formatDate(status.lastUpdated)}</dd>
            </dl>

            <div class="alert alert-light border small mb-3">
              ${escapeHtml(status.message || 'No status message available.')}
            </div>

            <div class="table-responsive">
              <table class="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Target</th>
                    <th>Started</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>${historyHtml}</tbody>
              </table>
            </div>
          </div>
        `;
    }).join('');

    $('#talosUpgradeBox').html(cards);
}

function setLoading(isLoading) {
    $('#refreshIcon').toggleClass('refresh-spin', isLoading);
    $('#refreshNow').prop('disabled', isLoading);
}

function showError(error) {
    $('#errorBox')
        .removeClass('d-none')
        .text(`Failed to load dashboard data: ${error}`);
}

function clearError() {
    $('#errorBox').addClass('d-none').text('');
}

function loadDashboard() {
    setLoading(true);
    clearError();

    $.when(
        $.getJSON(ENDPOINTS.nodes),
        $.getJSON(ENDPOINTS.kubernetes),
        $.getJSON(ENDPOINTS.talos)
    )
        .done(function(nodesResponse, kubernetesResponse, talosResponse) {
            const nodes = nodesResponse[0] || [];
            const kubernetes = kubernetesResponse[0] || {};
            const talos = talosResponse[0] || {};

            renderNodes(nodes);
            renderKubernetesUpgrade(kubernetes);
            renderTalosUpgrades(talos);

            $('#lastUpdated').text(`Last refreshed: ${new Date().toLocaleTimeString('utc')}`);
        })
        .fail(function(xhr, status, error) {
            showError(error || status || 'Unknown error');
        })
        .always(function() {
            setLoading(false);
        });
}

function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadDashboard, REFRESH_INTERVAL_MS);
}

$(function() {
    $('#refreshNow').on('click', loadDashboard);
    loadDashboard();
    startAutoRefresh();
});
