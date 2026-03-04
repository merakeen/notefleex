import { useState } from "react";
import {
  DeleteOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Typography,
} from "antd";

// ── VaultSwitcherButton ──────────────────────────────────────────────────────
// Pill button in the notes-pane that shows the current vault.
// Clicking opens a dropdown to switch vaults, create new ones, or delete non-default vaults.

export function VaultSwitcherButton({ vaults, activeVaultId, onSwitch, onCreate, onDelete }) {
  const activeVault = vaults.find((v) => v.id === activeVaultId);

  // Build menu items with vault entries + create option
  // Deletion is handled via a Popconfirm rendered inside the label to avoid
  // closing the dropdown prematurely (using e.stopPropagation).
  const menuItems = [
    ...vaults.map((vault) => ({
      key: vault.id,
      icon: vault.encrypted ? <LockOutlined /> : <SafetyOutlined />,
      label: (
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 160 }}
        >
          <span style={{ fontWeight: vault.id === activeVaultId ? 700 : 400, flex: 1 }}>
            {vault.name}
            {vault.id === activeVaultId && (
              <Typography.Text type="secondary" style={{ marginLeft: 6, fontSize: 11 }}>
                active
              </Typography.Text>
            )}
          </span>
          {vault.id !== "default" && (
            <Popconfirm
              title={`Delete "${vault.name}"?`}
              description="All notes in this vault will be permanently lost."
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(vault.id);
              }}
              onPopupClick={(e) => e.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ flexShrink: 0, padding: "0 4px" }}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </div>
      ),
    })),
    { type: "divider" },
    {
      key: "__create__",
      icon: <PlusOutlined />,
      label: "New vault",
    },
  ];

  function handleMenuClick({ key }) {
    if (key === "__create__") {
      onCreate();
    } else if (key !== activeVaultId) {
      onSwitch(key);
    }
  }

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <Button
        className="vault-switcher-btn"
        size="small"
        icon={activeVault?.encrypted ? <LockOutlined /> : <SafetyOutlined />}
      >
        {activeVault?.name ?? "Vault"}
      </Button>
    </Dropdown>
  );
}

// ── CreateVaultModal ─────────────────────────────────────────────────────────
// Form for creating a new vault with an optional password.

export function CreateVaultModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setUsePassword(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    setError("");

    if (!name.trim()) {
      setError("Vault name is required.");
      return;
    }

    if (usePassword) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      await onCreate(name.trim(), usePassword ? password : null);
      resetForm();
    } catch {
      setError("Failed to create vault. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create new vault"
      onCancel={handleClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Create vault"
      destroyOnHidden
    >
      <Form layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item label="Vault name" required>
          <Input
            placeholder="e.g. Personal, Work, Private"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            onPressEnter={handleSubmit}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: usePassword ? 12 : 0 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => {
                setUsePassword(e.target.checked);
                if (!e.target.checked) {
                  setPassword("");
                  setConfirmPassword("");
                }
              }}
            />
            <span>Encrypt this vault with a password</span>
          </label>
        </Form.Item>

        {usePassword && (
          <>
            <Form.Item label="Password">
              <Input.Password
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item label="Confirm password">
              <Input.Password
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                onPressEnter={handleSubmit}
              />
            </Form.Item>
            <Typography.Paragraph
              type="secondary"
              style={{ fontSize: 12, marginBottom: error ? 8 : 0 }}
            >
              There is no password recovery. If you forget the password, the vault and its notes
              cannot be recovered. This is intentional — notefleex is privacy-first.
            </Typography.Paragraph>
          </>
        )}

        {error && (
          <Typography.Text type="danger" style={{ fontSize: 13 }}>
            {error}
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}

// ── UnlockVaultModal ─────────────────────────────────────────────────────────
// Password prompt shown when the user switches to an encrypted vault
// that has not yet been unlocked this session.

export function UnlockVaultModal({ vault, onUnlock, onCancel }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!password) return;
    setError("");
    setLoading(true);
    try {
      await onUnlock(vault.id, password);
      setPassword("");
      setError("");
    } catch {
      setError("Wrong password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setPassword("");
    setError("");
    setLoading(false);
    onCancel();
  }

  return (
    <Modal
      open={Boolean(vault)}
      title={
        <Space>
          <LockOutlined />
          <span>Unlock — {vault?.name}</span>
        </Space>
      }
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Unlock"
      destroyOnHidden
    >
      <Form layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item label="Password">
          <Input.Password
            autoFocus
            placeholder="Enter vault password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleSubmit}
            autoComplete="current-password"
          />
        </Form.Item>

        {error && (
          <Typography.Text type="danger" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
            {error}
          </Typography.Text>
        )}

        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
          Your notes are encrypted with AES-256. The key is derived from your password and never
          stored — it exists only in memory while the vault is open.
        </Typography.Paragraph>
      </Form>
    </Modal>
  );
}
