import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LucidePlus } from 'lucide-react';
import ResultsTable from '../../components/ResultsTable/ResultsTable';
import InlineFilterBar from '../../components/InlineFilterBar/InlineFilterBar';
import { deleteOrganization } from '../../services/organizationApi';
import { executeCrmQuery, fetchFieldsForEntity } from '../../services/crmQueryApi';
import { fetchContacts } from '../../services/contactApi';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import SalesDetailView from '../../components/Sales/SalesDetailView';
import CreateOrganizationModal from '../../components/Sales/CreateOrganizationModal';
import EmailModal from '../../components/EmailModal/EmailModal';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import { exportToCSV } from '../../utils/exportUtils';
import { buildFieldsFromVariables } from '../../config/queryConfig';
import { enhanceFieldWithValues } from '../../utils/fieldUtils';
import { usePermission } from '../../hooks/usePermission';

const OrganizationsList = ({ query, onQueryChange, onResetQuery, variables, users, onSaveView }) => {
  const canExport = usePermission('ORGANIZATIONS_DELETE');

  // ── Server-side data ─────────────────────────────────────────────────────
  const [data, setData]                 = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSortLoading, setIsSortLoading] = useState(false);
  const [sortField, setSortField]       = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage]         = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Save View modal ───────────────────────────────────────────────────────
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId]           = useState(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen]   = useState(false);
  const [emailRecipients, setEmailRecipients]     = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete]         = useState([]);

  const location = useLocation();

  // ── Entity Fields Management ─────────────────────────────────────────────
  const [entityFields, setEntityFields] = useState([]);
  
  const fields = useMemo(() => {
    if (!entityFields.length) return [];
    const baseFields = buildFieldsFromVariables(entityFields);
    return baseFields.map((field) => enhanceFieldWithValues(data, field));
  }, [entityFields, data]);

  useEffect(() => {
    fetchFieldsForEntity('ORGANIZATION')
      .then(setEntityFields)
      .catch(err => console.error("Failed to load Organization fields", err));
  }, []);

  // ── Data Loading (Server-side RQB) ───────────────────────────────────────
  const loadData = useCallback(async (isSorting = false) => {
    if (isSorting) setIsSortLoading(true);
    else setIsLoading(true);
    try {
      // Ensure we have a valid query structure
      const currentQuery = query || { combinator: 'and', rules: [] };
      
      const response = await executeCrmQuery({
        entityType: 'ORGANIZATION',
        combinator: currentQuery.combinator,
        rules: currentQuery.rules,
        page: page - 1,
        size: itemsPerPage,
        sortBy: sortField,
        sortDir: sortDirection,
      });

      setData(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
      setIsSortLoading(false);
    }
  }, [query, page, itemsPerPage, sortField, sortDirection]);

  useEffect(() => { loadData(); }, [query, page, itemsPerPage, sortField, sortDirection]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRowClick = (row) => setSelectedId(prev => prev === row.id ? null : row.id);

  const handleBulkDeleteRequested = useCallback((ids) => {
    setItemsToDelete(ids);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    try {
      await Promise.all(itemsToDelete.map(id => deleteOrganization(id)));
      toast.success(`${itemsToDelete.length} item(s) deleted successfully.`);
      loadData();
    } catch {
      toast.error('Failed to delete some items');
    } finally {
      setIsConfirmModalOpen(false);
      setItemsToDelete([]);
    }
  };

  const handleBulkEmailRequested = useCallback(async (ids) => {
    if (ids.length === 1) {
      // Single row: fetch the org's first contact to use as the email recipient
      const org = data.find(item => item.id === ids[0]);
      try {
        const res = await fetchContacts({ organizationId: ids[0], size: 1 });
        const contact = (res.content || res)[0];
        const recipient = contact
          ? { ...org, displayName: `${contact.firstName} ${contact.lastName}`.trim(), email: contact.email }
          : { ...org, displayName: org.name };
        setEmailRecipients([recipient]);
      } catch {
        setEmailRecipients([{ ...org, displayName: org.name }]);
      }
    } else {
      // Bulk: use whatever name data is available in the loaded rows
      const selected = data.filter(item => ids.includes(item.id));
      setEmailRecipients(selected.map(item => ({
        ...item,
        displayName: item.primaryContactName || item.contactName || item.name,
      })));
    }
    setIsEmailModalOpen(true);
  }, [data]);

  const handleSaveView = useCallback(async (name) => {
    window.dispatchEvent(new CustomEvent('salesOpenSaveView', { detail: name }));
  }, []);

  const columns = [
    { key: 'name',           label: 'Organization Name' },
    { key: 'industry',       label: 'Industry' },
    { key: 'country',        label: 'Country' },
    { key: 'annualRevenue',  label: 'Annual Revenue' },
    { key: 'employeeCount',  label: 'Employees' },
    { key: 'assignedToName', label: 'Owner' },
  ];

  return (
    <div className="sales-workspace-page">
      <div className="sales-page-header">
        <h2 className="page-title-gradient">Organizations</h2>
        <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <LucidePlus size={15} />
          New Organization
        </button>
      </div>

      <InlineFilterBar
        fields={fields}
        query={query}
        onQueryChange={onQueryChange}
        onResetQuery={onResetQuery}
        quickFilters={['industry', 'lifecycleStage']}
      />

      <div className="sales-table-wrapper">
        <ResultsTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          isSortLoading={isSortLoading}
          currentPage={page}
          totalItems={totalElements}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={(s) => { setItemsPerPage(s); setPage(1); }}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={(field, dir) => { setSortField(field); setSortDirection(dir); }}
          onExport={canExport ? () => exportToCSV(data, 'organizations_export') : undefined}
          onSaveView={onSaveView}
          onResetQuery={onResetQuery}
          onBulkDelete={handleBulkDeleteRequested}
          onBulkEmail={handleBulkEmailRequested}
          onRowClick={handleRowClick}
          expandedRowId={selectedId && !modalOpen ? selectedId : null}
          renderExpandedRow={(row) => (
            <SalesDetailView entityId={row.id} entityType="organization" mode="inline" onFullScreen={() => setModalOpen(true)} />
          )}
          query={query}
        />
      </div>

      {modalOpen && selectedId && (
        <SalesDetailView entityId={selectedId} entityType="organization" mode="modal" onClose={() => setModalOpen(false)} />
      )}
      <CreateOrganizationModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={loadData} />
      <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} recipients={emailRecipients} onSend={() => { toast.success(`Email sent to ${emailRecipients.length} recipients!`); setIsEmailModalOpen(false); }} />
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Delete Organizations" message={`Delete ${itemsToDelete.length} organization(s)? This cannot be undone.`} confirmText="Confirm Delete" />
    </div>
  );
};

export default OrganizationsList;
