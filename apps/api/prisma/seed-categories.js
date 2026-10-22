"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const categories = [
    {
        name: 'Moradia',
        slug: 'moradia',
        type: client_1.CategoryType.EXPENSE,
        description: 'Despesas relacionadas à residência.',
        color: '#64748B',
        icon: 'house',
        subCategories: [
            { name: 'Aluguel', slug: 'aluguel', icon: 'house' },
            { name: 'Condomínio', slug: 'condominio', icon: 'building' },
            { name: 'Energia elétrica', slug: 'energia-eletrica', icon: 'zap' },
            { name: 'Água e esgoto', slug: 'agua-esgoto', icon: 'droplets' },
            { name: 'Internet e telefone', slug: 'internet-telefone', icon: 'wifi' },
            { name: 'Gás', slug: 'gas', icon: 'flame' },
            { name: 'Manutenção residencial', slug: 'manutencao-residencial', icon: 'wrench' },
            { name: 'Móveis e decoração', slug: 'moveis-decoracao', icon: 'sofa' },
        ],
    },
    {
        name: 'Alimentação',
        slug: 'alimentacao',
        type: client_1.CategoryType.EXPENSE,
        description: 'Despesas com alimentação e refeições.',
        color: '#F59E0B',
        icon: 'utensils',
        subCategories: [
            { name: 'Supermercado', slug: 'supermercado', icon: 'shopping-cart' },
            { name: 'Restaurantes', slug: 'restaurantes', icon: 'utensils' },
            { name: 'Delivery', slug: 'delivery', icon: 'bike' },
            { name: 'Padaria', slug: 'padaria', icon: 'croissant' },
            { name: 'Feira', slug: 'feira', icon: 'apple' },
        ],
    },
    {
        name: 'Transporte',
        slug: 'transporte',
        type: client_1.CategoryType.EXPENSE,
        description: 'Deslocamentos e transporte público ou privado.',
        color: '#0EA5E9',
        icon: 'bus',
        subCategories: [
            { name: 'Transporte público', slug: 'transporte-publico', icon: 'bus' },
            { name: 'Aplicativos de transporte', slug: 'aplicativos-transporte', icon: 'car' },
            { name: 'Táxi', slug: 'taxi', icon: 'car-taxi-front' },
            { name: 'Estacionamento', slug: 'estacionamento', icon: 'parking-circle' },
            { name: 'Pedágio', slug: 'pedagio', icon: 'road' },
        ],
    },
    {
        name: 'Veículos',
        slug: 'veiculos',
        type: client_1.CategoryType.EXPENSE,
        description: 'Custos de propriedade e utilização de veículos.',
        color: '#6366F1',
        icon: 'car-front',
        isVehicleCategory: true,
        subCategories: [
            { name: 'Combustível', slug: 'combustivel', icon: 'fuel' },
            { name: 'Manutenção', slug: 'manutencao-veiculo', icon: 'wrench' },
            { name: 'Seguro', slug: 'seguro-veiculo', icon: 'shield-check' },
            { name: 'IPVA', slug: 'ipva', icon: 'receipt' },
            { name: 'Licenciamento', slug: 'licenciamento', icon: 'file-check' },
            { name: 'Lavagem', slug: 'lavagem', icon: 'droplets' },
            { name: 'Multas', slug: 'multas', icon: 'file-warning' },
        ],
    },
    {
        name: 'Saúde',
        slug: 'saude',
        type: client_1.CategoryType.EXPENSE,
        description: 'Despesas médicas, odontológicas e de bem-estar.',
        color: '#EF4444',
        icon: 'heart-pulse',
        subCategories: [
            { name: 'Plano de saúde', slug: 'plano-saude', icon: 'heart-pulse' },
            { name: 'Consultas', slug: 'consultas', icon: 'stethoscope' },
            { name: 'Exames', slug: 'exames', icon: 'flask-conical' },
            { name: 'Medicamentos', slug: 'medicamentos', icon: 'pill' },
            { name: 'Odontologia', slug: 'odontologia', icon: 'smile' },
            { name: 'Academia e atividades físicas', slug: 'academia-atividades-fisicas', icon: 'dumbbell' },
        ],
    },
    {
        name: 'Educação',
        slug: 'educacao',
        type: client_1.CategoryType.EXPENSE,
        description: 'Despesas com formação e materiais educacionais.',
        color: '#8B5CF6',
        icon: 'graduation-cap',
        subCategories: [
            { name: 'Mensalidade escolar', slug: 'mensalidade-escolar', icon: 'school' },
            { name: 'Cursos', slug: 'cursos', icon: 'book-open' },
            { name: 'Livros e materiais', slug: 'livros-materiais', icon: 'book' },
            { name: 'Material escolar', slug: 'material-escolar', icon: 'pencil' },
        ],
    },
    {
        name: 'Compras pessoais',
        slug: 'compras-pessoais',
        type: client_1.CategoryType.EXPENSE,
        description: 'Compras e itens de uso pessoal.',
        color: '#EC4899',
        icon: 'shopping-bag',
        subCategories: [
            { name: 'Roupas e calçados', slug: 'roupas-calcados', icon: 'shirt' },
            { name: 'Eletrônicos', slug: 'eletronicos', icon: 'smartphone' },
            { name: 'Cosméticos', slug: 'cosmeticos', icon: 'spray-can' },
            { name: 'Acessórios', slug: 'acessorios', icon: 'watch' },
        ],
    },
    {
        name: 'Lazer',
        slug: 'lazer',
        type: client_1.CategoryType.EXPENSE,
        description: 'Entretenimento, viagens e atividades de lazer.',
        color: '#14B8A6',
        icon: 'ticket',
        subCategories: [
            { name: 'Cinema e eventos', slug: 'cinema-eventos', icon: 'ticket' },
            { name: 'Viagens', slug: 'viagens', icon: 'plane' },
            { name: 'Hospedagem', slug: 'hospedagem', icon: 'bed-double' },
            { name: 'Assinaturas digitais', slug: 'assinaturas-digitais', icon: 'tv' },
            { name: 'Hobbies', slug: 'hobbies', icon: 'palette' },
        ],
    },
    {
        name: 'Família e pets',
        slug: 'familia-pets',
        type: client_1.CategoryType.EXPENSE,
        description: 'Despesas familiares e cuidados com animais.',
        color: '#F97316',
        icon: 'users',
        subCategories: [
            { name: 'Despesas com filhos', slug: 'despesas-filhos', icon: 'baby' },
            { name: 'Veterinário', slug: 'veterinario', icon: 'stethoscope' },
            { name: 'Alimentação de pets', slug: 'alimentacao-pets', icon: 'bone' },
            { name: 'Acessórios para pets', slug: 'acessorios-pets', icon: 'paw-print' },
        ],
    },
    {
        name: 'Impostos e tarifas',
        slug: 'impostos-tarifas',
        type: client_1.CategoryType.EXPENSE,
        description: 'Tributos, tarifas bancárias e encargos.',
        color: '#78716C',
        icon: 'receipt',
        subCategories: [
            { name: 'Impostos', slug: 'impostos', icon: 'landmark' },
            { name: 'Tarifas bancárias', slug: 'tarifas-bancarias', icon: 'landmark' },
            { name: 'Juros e encargos', slug: 'juros-encargos', icon: 'percent' },
            { name: 'Multas e taxas', slug: 'multas-taxas', icon: 'file-warning' },
        ],
    },
    {
        name: 'Investimentos',
        slug: 'investimentos-despesas',
        type: client_1.CategoryType.EXPENSE,
        description: 'Aportes e aplicações financeiras registrados como saída.',
        color: '#059669',
        icon: 'chart-no-axes-combined',
        subCategories: [
            { name: 'Renda fixa', slug: 'renda-fixa-aporte', icon: 'landmark' },
            { name: 'Renda variável', slug: 'renda-variavel-aporte', icon: 'chart-line' },
            { name: 'Fundos', slug: 'fundos-aporte', icon: 'layers' },
            { name: 'Previdência privada', slug: 'previdencia-privada', icon: 'shield-check' },
        ],
    },
    {
        name: 'Outras despesas',
        slug: 'outras-despesas',
        type: client_1.CategoryType.EXPENSE,
        description: 'Despesas que não se enquadram nas demais categorias.',
        color: '#94A3B8',
        icon: 'ellipsis',
        subCategories: [
            { name: 'Doações', slug: 'doacoes', icon: 'hand-heart' },
            { name: 'Presentes', slug: 'presentes', icon: 'gift' },
            { name: 'Despesas diversas', slug: 'despesas-diversas', icon: 'circle-help' },
        ],
    },
    {
        name: 'Salário e remuneração',
        slug: 'salario-remuneracao',
        type: client_1.CategoryType.INCOME,
        description: 'Rendimentos do trabalho e remuneração profissional.',
        color: '#16A34A',
        icon: 'wallet',
        subCategories: [
            { name: 'Salário', slug: 'salario', icon: 'wallet' },
            { name: 'Comissões', slug: 'comissoes', icon: 'badge-dollar-sign' },
            { name: 'Bônus e participação', slug: 'bonus-participacao', icon: 'award' },
            { name: 'Horas extras', slug: 'horas-extras', icon: 'clock' },
        ],
    },
    {
        name: 'Trabalho autônomo',
        slug: 'trabalho-autonomo',
        type: client_1.CategoryType.INCOME,
        description: 'Receitas de prestação de serviços e trabalho independente.',
        color: '#22C55E',
        icon: 'briefcase-business',
        subCategories: [
            { name: 'Prestação de serviços', slug: 'prestacao-servicos', icon: 'briefcase' },
            { name: 'Freelance', slug: 'freelance', icon: 'laptop' },
            { name: 'Consultoria', slug: 'consultoria', icon: 'messages-square' },
        ],
    },
    {
        name: 'Vendas',
        slug: 'vendas-receitas',
        type: client_1.CategoryType.INCOME,
        description: 'Receitas provenientes da venda de produtos ou bens.',
        color: '#0D9488',
        icon: 'shopping-cart',
        subCategories: [
            { name: 'Produtos', slug: 'venda-produtos', icon: 'package' },
            { name: 'Bens usados', slug: 'venda-bens-usados', icon: 'tag' },
            { name: 'Outras vendas', slug: 'outras-vendas', icon: 'hand-coins' },
        ],
    },
    {
        name: 'Rendimentos financeiros',
        slug: 'rendimentos-financeiros',
        type: client_1.CategoryType.INCOME,
        description: 'Rendimentos provenientes de aplicações financeiras.',
        color: '#0284C7',
        icon: 'chart-no-axes-combined',
        subCategories: [
            { name: 'Juros recebidos', slug: 'juros-recebidos', icon: 'percent' },
            { name: 'Dividendos', slug: 'dividendos', icon: 'coins' },
            { name: 'Rendimentos de fundos', slug: 'rendimentos-fundos', icon: 'layers' },
            { name: 'Rendimentos de renda fixa', slug: 'rendimentos-renda-fixa', icon: 'landmark' },
        ],
    },
    {
        name: 'Aluguéis recebidos',
        slug: 'aluguéis-recebidos',
        type: client_1.CategoryType.INCOME,
        description: 'Receitas provenientes de locação de imóveis ou bens.',
        color: '#7C3AED',
        icon: 'building',
        subCategories: [
            { name: 'Aluguel de imóveis', slug: 'aluguel-imoveis-recebido', icon: 'house' },
            { name: 'Aluguel de veículos', slug: 'aluguel-veiculos-recebido', icon: 'car-front' },
            { name: 'Outras locações', slug: 'outras-locacoes', icon: 'key-round' },
        ],
    },
    {
        name: 'Benefícios e reembolsos',
        slug: 'beneficios-reembolsos',
        type: client_1.CategoryType.INCOME,
        description: 'Benefícios, restituições e reembolsos recebidos.',
        color: '#CA8A04',
        icon: 'hand-coins',
        subCategories: [
            { name: 'Reembolso', slug: 'reembolso', icon: 'receipt' },
            { name: 'Restituição de imposto', slug: 'restituicao-imposto', icon: 'landmark' },
            { name: 'Benefícios', slug: 'beneficios', icon: 'gift' },
        ],
    },
    {
        name: 'Outras receitas',
        slug: 'outras-receitas',
        type: client_1.CategoryType.INCOME,
        description: 'Receitas que não se enquadram nas demais categorias.',
        color: '#64748B',
        icon: 'circle-dollar-sign',
        subCategories: [
            { name: 'Presentes recebidos', slug: 'presentes-recebidos', icon: 'gift' },
            { name: 'Prêmios', slug: 'premios', icon: 'trophy' },
            { name: 'Receitas diversas', slug: 'receitas-diversas', icon: 'circle-help' },
        ],
    },
];
const categoryDomains = {
    moradia: ['DOMESTIC'],
    alimentacao: ['DOMESTIC'],
    transporte: ['TRANSPORT'],
    veiculos: ['VEHICLES'],
    saude: ['HEALTH'],
    investimentos: ['INVESTMENTS'],
    'investimentos-despesas': ['INVESTMENTS'],
    'outras-despesas': ['OTHER'],
    'outras-receitas': ['OTHER'],
    'rendimentos-financeiros': ['INVESTMENTS'],
};
async function seedCategoryTemplates() {
    for (const item of categories) {
        const template = await prisma.categoryTemplate.upsert({
            where: { slug: item.slug },
            create: {
                name: item.name,
                slug: item.slug,
                type: item.type,
                description: item.description,
                color: item.color,
                icon: item.icon,
                isVehicleCategory: item.isVehicleCategory ?? false,
            },
            update: {
                name: item.name,
                type: item.type,
                description: item.description,
                color: item.color,
                icon: item.icon,
                isVehicleCategory: item.isVehicleCategory ?? false,
            },
        });
        const desiredDomains = categoryDomains[item.slug] ?? ['DOMESTIC'];
        const existingDomains = await prisma.categoryTemplateDomain.findMany({
            where: { templateId: template.id },
            select: { domain: true },
        });
        const existingDomainSet = new Set(existingDomains.map((entry) => entry.domain));
        for (const domain of desiredDomains) {
            if (!existingDomainSet.has(domain)) {
                await prisma.categoryTemplateDomain.create({
                    data: {
                        templateId: template.id,
                        domain: domain,
                    },
                });
            }
        }
        for (const subItem of item.subCategories) {
            await prisma.subCategoryTemplate.upsert({
                where: {
                    categoryTemplateId_slug: {
                        categoryTemplateId: template.id,
                        slug: subItem.slug,
                    },
                },
                create: {
                    categoryTemplateId: template.id,
                    name: subItem.name,
                    slug: subItem.slug,
                    description: subItem.description ?? null,
                    icon: subItem.icon ?? null,
                },
                update: {
                    name: subItem.name,
                    description: subItem.description ?? null,
                    icon: subItem.icon ?? null,
                },
            });
        }
    }
    console.log('Templates globais de categorias sincronizados.');
}
async function seedCategoriesForTenant(tenantId, tenantName) {
    let createdCategories = 0;
    let createdSubCategories = 0;
    let skippedDeleted = 0;
    for (const item of categories) {
        let category = await prisma.category.findUnique({
            where: {
                tenantId_slug: {
                    tenantId,
                    slug: item.slug,
                },
            },
        });
        if (!category) {
            category = await prisma.category.create({
                data: {
                    tenantId,
                    name: item.name,
                    slug: item.slug,
                    type: item.type,
                    description: item.description,
                    color: item.color,
                    icon: item.icon,
                    isVehicleCategory: item.isVehicleCategory ?? false,
                },
            });
            createdCategories += 1;
        }
        if (category.deletedAt) {
            skippedDeleted += 1;
            continue;
        }
        for (const subItem of item.subCategories) {
            const existingSubCategory = await prisma.subCategory.findUnique({
                where: {
                    categoryId_slug: {
                        categoryId: category.id,
                        slug: subItem.slug,
                    },
                },
            });
            if (existingSubCategory) {
                continue;
            }
            await prisma.subCategory.create({
                data: {
                    categoryId: category.id,
                    name: subItem.name,
                    slug: subItem.slug,
                    description: subItem.description ?? null,
                    color: null,
                    icon: subItem.icon ?? null,
                },
            });
            createdSubCategories += 1;
        }
    }
    console.log(`[${tenantName}] Categorias criadas: ${createdCategories}; ` +
        `subcategorias criadas: ${createdSubCategories}; ` +
        `categorias excluídas ignoradas: ${skippedDeleted}.`);
}
async function main() {
    console.log('Iniciando seed de categorias e subcategorias...');
    await seedCategoryTemplates();
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
    if (tenants.length === 0) {
        console.log('Nenhum espaço encontrado. Nenhuma categoria foi criada.');
        return;
    }
    for (const tenant of tenants) {
        await seedCategoriesForTenant(tenant.id, tenant.name);
    }
    console.log('Seed de categorias e subcategorias concluído.');
}
main()
    .catch((error) => {
    console.error('Falha ao executar seed de categorias:', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-categories.js.map