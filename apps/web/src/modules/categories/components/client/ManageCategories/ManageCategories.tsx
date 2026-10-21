"use client";

import { Fragment, useMemo, useState, type FormEvent } from "react";

import {
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "@/components/icons";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import { useCategories } from "@/modules/categories/hooks";
import { categoriesService } from "@/modules/categories/services/categories.service";
import type {
  Category,
  CategoryType,
  SaveCategoryInput,
  SubCategory,
} from "@/modules/categories/types";

import styles from "./ManageCategories.module.scss";

type CategoryForm = {
  name: string;
  type: CategoryType;
  description: string;
  color: string;
  icon: string;
  isVehicleCategory: boolean;
  parentId: string;
};

type SubCategoryForm = {
  name: string;
  description: string;
  color: string;
  icon: string;
};

const EMPTY_CATEGORY: CategoryForm = {
  name: "",
  type: "EXPENSE",
  description: "",
  color: "#64748b",
  icon: "",
  isVehicleCategory: false,
  parentId: "",
};

const EMPTY_SUBCATEGORY: SubCategoryForm = {
  name: "",
  description: "",
  color: "",
  icon: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function ManageCategories() {
  const { categories, loading, error, loadCategories } = useCategories();

  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [search, setSearch] = useState("");

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(EMPTY_CATEGORY);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] =
    useState<SubCategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] =
    useState<SubCategoryForm>(EMPTY_SUBCATEGORY);
  const [subcategorySaving, setSubcategorySaving] = useState(false);
  const [subcategoryError, setSubcategoryError] = useState("");
  const [pageError, setPageError] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    null,
  );

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return categories
      .filter((category) => category.type === type)
      .filter((category) => {
        if (!normalizedSearch) return true;

        return (
          category.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
          (category.description ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [categories, search, type]);

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm({ ...EMPTY_CATEGORY, type });
    setCategoryError("");
    setCategoryModalOpen(true);
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      type: category.type,
      description: category.description ?? "",
      color: category.color ?? "#64748b",
      icon: category.icon ?? "",
      isVehicleCategory: category.isVehicleCategory,
      parentId: category.parentId ?? "",
    });
    setCategoryError("");
    setCategoryModalOpen(true);
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryError("");

    if (categoryForm.name.trim().length < 2) {
      setCategoryError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    const payload: SaveCategoryInput = {
      name: categoryForm.name.trim(),
      type: categoryForm.type,
      description: categoryForm.description.trim() || undefined,
      color: categoryForm.color.trim() || undefined,
      icon: categoryForm.icon.trim() || undefined,
      isVehicleCategory: categoryForm.isVehicleCategory,
      parentId: categoryForm.parentId || null,
    };

    setCategorySaving(true);

    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.id, payload);
      } else {
        await categoriesService.create(payload);
      }

      setCategoryModalOpen(false);
      await loadCategories();
    } catch (saveError) {
      setCategoryError(
        getErrorMessage(saveError, "Não foi possível salvar a categoria."),
      );
    } finally {
      setCategorySaving(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Deseja excluir a categoria "${category.name}"?`,
    );

    if (!confirmed) return;

    setPageError("");

    try {
      await categoriesService.delete(category.id);
      await loadCategories();

      if (selectedCategory?.id === category.id) {
        setSelectedCategory(null);
        setSubcategories([]);
      }
    } catch (deleteError) {
      setPageError(
        getErrorMessage(
          deleteError,
          "Não foi possível excluir a categoria. Verifique se ela possui subcategorias ou vínculos.",
        ),
      );
    }
  }

  async function openSubcategories(category: Category) {
    setPageError("");
    setSelectedCategory(category);
    setExpandedCategoryId((current) =>
      current === category.id ? null : category.id,
    );

    try {
      const result = await categoriesService.listSubCategories(category.id);
      setSubcategories(result);
    } catch (loadError) {
      setSubcategories([]);
      setPageError(
        getErrorMessage(loadError, "Não foi possível carregar as subcategorias."),
      );
    }
  }

  function openCreateSubcategory(category: Category) {
    setSelectedCategory(category);
    setEditingSubcategory(null);
    setSubcategoryForm(EMPTY_SUBCATEGORY);
    setSubcategoryError("");
    setSubcategoryModalOpen(true);
  }

  function openEditSubcategory(subcategory: SubCategory) {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description ?? "",
      color: subcategory.color ?? "",
      icon: subcategory.icon ?? "",
    });
    setSubcategoryError("");
    setSubcategoryModalOpen(true);
  }

  async function handleSaveSubcategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubcategoryError("");

    if (!selectedCategory) return;

    if (subcategoryForm.name.trim().length < 2) {
      setSubcategoryError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    const payload = {
      name: subcategoryForm.name.trim(),
      description: subcategoryForm.description.trim() || undefined,
      color: subcategoryForm.color.trim() || undefined,
      icon: subcategoryForm.icon.trim() || undefined,
    };

    setSubcategorySaving(true);

    try {
      if (editingSubcategory) {
        await categoriesService.updateSubCategory(
          selectedCategory.id,
          editingSubcategory.id,
          payload,
        );
      } else {
        await categoriesService.createSubCategory(selectedCategory.id, payload);
      }

      const result = await categoriesService.listSubCategories(
        selectedCategory.id,
      );
      setSubcategories(result);
      setSubcategoryModalOpen(false);
    } catch (saveError) {
      setSubcategoryError(
        getErrorMessage(saveError, "Não foi possível salvar a subcategoria."),
      );
    } finally {
      setSubcategorySaving(false);
    }
  }

  async function handleDeleteSubcategory(subcategory: SubCategory) {
    if (!selectedCategory) return;

    const confirmed = window.confirm(
      `Deseja excluir a subcategoria "${subcategory.name}"?`,
    );

    if (!confirmed) return;

    setPageError("");

    try {
      await categoriesService.deleteSubCategory(
        selectedCategory.id,
        subcategory.id,
      );

      const result = await categoriesService.listSubCategories(
        selectedCategory.id,
      );
      setSubcategories(result);
    } catch (deleteError) {
      setPageError(
        getErrorMessage(deleteError, "Não foi possível excluir a subcategoria."),
      );
    }
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Categorias</h1>
            <p className={styles.description}>
              Organize as receitas e despesas do seu espaço financeiro.
            </p>
          </div>

          <Button type="button" onClick={openCreateCategory}>
            <Plus size={18} />
            Nova categoria
          </Button>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.tabs} aria-label="Tipo de categoria">
            <button
              type="button"
              className={type === "EXPENSE" ? styles.activeTab : styles.tab}
              aria-pressed={type === "EXPENSE"}
              onClick={() => setType("EXPENSE")}
            >
              Despesas
            </button>
            <button
              type="button"
              className={type === "INCOME" ? styles.activeTab : styles.tab}
              aria-pressed={type === "INCOME"}
              onClick={() => setType("INCOME")}
            >
              Receitas
            </button>
          </div>

          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar categoria..."
              aria-label="Pesquisar categoria"
            />
          </label>
        </div>

        {pageError && (
          <div className={styles.error} role="alert">
            {pageError}
          </div>
        )}

        {loading ? (
          <div className={styles.feedback}>Carregando categorias...</div>
        ) : error ? (
          <div className={styles.feedback} role="alert">
            Não foi possível carregar as categorias. Confira o espaço ativo e
            tente novamente.
            <Button type="button" variant="secondary" onClick={() => void loadCategories()}>
              Tentar novamente
            </Button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className={styles.empty}>
            <Tags size={34} strokeWidth={1.5} />
            <h2>Nenhuma categoria encontrada</h2>
            <p>
              {search.trim()
                ? "Tente pesquisar com outro termo."
                : `Cadastre sua primeira categoria de ${
                    type === "EXPENSE" ? "despesa" : "receita"
                  }.`}
            </p>
            {!search.trim() && (
              <Button type="button" onClick={openCreateCategory}>
                <Plus size={17} />
                Nova categoria
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Subcategorias</th>
                  <th className={styles.actionsHeader}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <Fragment key={category.id}>
                  <tr>
                    <td>
                      <div className={styles.categoryName}>
                        <span
                          className={styles.color}
                          style={{ backgroundColor: category.color || "#64748b" }}
                          aria-hidden="true"
                        />
                        <strong>{category.name}</strong>
                        {category.isVehicleCategory && (
                          <span className={styles.vehicleTag}>Veicular</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.descriptionCell}>
                      {category.description || "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.subcategoryToggle}
                        onClick={() => void openSubcategories(category)}
                        aria-expanded={expandedCategoryId === category.id}
                      >
                        {expandedCategoryId === category.id
                          ? "Ocultar"
                          : "Gerenciar"}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => openEditCategory(category)}
                          aria-label={`Editar categoria ${category.name}`}
                          title="Editar categoria"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => void handleDeleteCategory(category)}
                          aria-label={`Excluir categoria ${category.name}`}
                          title="Excluir categoria"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
            {expandedCategoryId === category.id && selectedCategory?.id === category.id && (
                    <tr className={styles.subcategoryRow}>
                      <td colSpan={4}>
              <section className={styles.subcategoryPanel}>
                <div className={styles.subcategoryHeader}>
                  <div>
                    <h2>Subcategorias de {selectedCategory.name}</h2>
                    <p>Gerencie os detalhamentos desta categoria.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => openCreateSubcategory(selectedCategory)}
                  >
                    <Plus size={16} />
                    Nova subcategoria
                  </Button>
                </div>

                {subcategories.length === 0 ? (
                  <p className={styles.noSubcategories}>
                    Nenhuma subcategoria cadastrada.
                  </p>
                ) : (
                  <ul className={styles.subcategoryList}>
                    {subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <span
                          className={styles.color}
                          style={{
                            backgroundColor: subcategory.color || "#94a3b8",
                          }}
                          aria-hidden="true"
                        />
                        <span className={styles.subcategoryName}>
                          {subcategory.name}
                        </span>
                        {subcategory.description && (
                          <span className={styles.subcategoryDescription}>
                            {subcategory.description}
                          </span>
                        )}
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => openEditSubcategory(subcategory)}
                            aria-label={`Editar subcategoria ${subcategory.name}`}
                            title="Editar subcategoria"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => void handleDeleteSubcategory(subcategory)}
                            aria-label={`Excluir subcategoria ${subcategory.name}`}
                            title="Excluir subcategoria"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>


          </div>
        )}

        {!loading && !error && filteredCategories.length > 0 && (
          <p className={styles.total}>
            {filteredCategories.length} categoria
            {filteredCategories.length !== 1 ? "s" : ""}
          </p>
        )}
      </section>

      <Modal
        open={categoryModalOpen}
        onClose={() => !categorySaving && setCategoryModalOpen(false)}
        title={editingCategory ? "Editar categoria" : "Nova categoria"}
        closeOnOverlayClick={!categorySaving}
      >
        <form className={styles.form} onSubmit={handleSaveCategory}>
          <Field label="Nome" htmlFor="category-name" required>
            <Input
              id="category-name"
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, name: event.target.value })
              }
              placeholder="Ex.: Alimentação"
              maxLength={100}
              autoFocus
              disabled={categorySaving}
              required
            />
          </Field>

          <Field label="Tipo" htmlFor="category-type" required>
            <Select
              id="category-type"
              value={categoryForm.type}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  type: event.target.value as CategoryType,
                  parentId: "",
                })
              }
              disabled={categorySaving}
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </Select>
          </Field>

          <Field label="Categoria principal" htmlFor="category-parent">
            <Select
              id="category-parent"
              value={categoryForm.parentId}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, parentId: event.target.value })
              }
              disabled={categorySaving}
            >
              <option value="">Nenhuma (categoria principal)</option>
              {categories
                .filter(
                  (category) =>
                    category.type === categoryForm.type &&
                    category.id !== editingCategory?.id &&
                    category.parentId == null,
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Descrição" htmlFor="category-description">
            <Textarea
              id="category-description"
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  description: event.target.value,
                })
              }
              placeholder="Descrição opcional"
              maxLength={500}
              rows={3}
              disabled={categorySaving}
            />
          </Field>

          <div className={styles.formRow}>
            <Field label="Cor" htmlFor="category-color">
              <Input
                id="category-color"
                type="color"
                value={categoryForm.color}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, color: event.target.value })
                }
                disabled={categorySaving}
              />
            </Field>

            <Field label="Ícone" htmlFor="category-icon">
              <Input
                id="category-icon"
                value={categoryForm.icon}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, icon: event.target.value })
                }
                placeholder="Ex.: utensils"
                maxLength={100}
                disabled={categorySaving}
              />
            </Field>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={categoryForm.isVehicleCategory}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  isVehicleCategory: event.target.checked,
                })
              }
              disabled={categorySaving}
            />
            Categoria relacionada a veículos
          </label>

          {categoryError && (
            <div className={styles.error} role="alert">
              {categoryError}
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCategoryModalOpen(false)}
              disabled={categorySaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={categorySaving}>
              {editingCategory ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={subcategoryModalOpen}
        onClose={() => !subcategorySaving && setSubcategoryModalOpen(false)}
        title={
          editingSubcategory ? "Editar subcategoria" : "Nova subcategoria"
        }
        closeOnOverlayClick={!subcategorySaving}
      >
        <form className={styles.form} onSubmit={handleSaveSubcategory}>
          <p className={styles.modalDescription}>
            Categoria: <strong>{selectedCategory?.name}</strong>
          </p>

          <Field label="Nome" htmlFor="subcategory-name" required>
            <Input
              id="subcategory-name"
              value={subcategoryForm.name}
              onChange={(event) =>
                setSubcategoryForm({
                  ...subcategoryForm,
                  name: event.target.value,
                })
              }
              placeholder="Ex.: Supermercado"
              maxLength={100}
              autoFocus
              required
              disabled={subcategorySaving}
            />
          </Field>

          <Field label="Descrição" htmlFor="subcategory-description">
            <Textarea
              id="subcategory-description"
              value={subcategoryForm.description}
              onChange={(event) =>
                setSubcategoryForm({
                  ...subcategoryForm,
                  description: event.target.value,
                })
              }
              placeholder="Descrição opcional"
              maxLength={500}
              rows={3}
              disabled={subcategorySaving}
            />
          </Field>

          <div className={styles.formRow}>
            <Field label="Cor" htmlFor="subcategory-color">
              <Input
                id="subcategory-color"
                type="color"
                value={subcategoryForm.color || "#94a3b8"}
                onChange={(event) =>
                  setSubcategoryForm({
                    ...subcategoryForm,
                    color: event.target.value,
                  })
                }
                disabled={subcategorySaving}
              />
            </Field>
            <Field label="Ícone" htmlFor="subcategory-icon">
              <Input
                id="subcategory-icon"
                value={subcategoryForm.icon}
                onChange={(event) =>
                  setSubcategoryForm({
                    ...subcategoryForm,
                    icon: event.target.value,
                  })
                }
                placeholder="Ex.: shopping-cart"
                maxLength={100}
                disabled={subcategorySaving}
              />
            </Field>
          </div>

          {subcategoryError && (
            <div className={styles.error} role="alert">
              {subcategoryError}
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSubcategoryModalOpen(false)}
              disabled={subcategorySaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={subcategorySaving}>
              {editingSubcategory ? "Salvar alterações" : "Criar subcategoria"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
