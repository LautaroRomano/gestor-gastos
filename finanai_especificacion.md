# Aplicación de Finanzas Personales + WhatsApp

## Objetivo
Crear una aplicación que registre ingresos y gastos desde una web y mediante WhatsApp, y genere análisis automáticos: principales gastos, gastos recurrentes/extraordinarios, gastos prescindibles, balance, presupuesto, proyección de fin de mes y ahorro recomendado.

## Propuesta de valor
**Registrar → Entender → Analizar → Recomendar → Predecir**

La aplicación no debe limitarse a mostrar cuánto gastó el usuario. Debe explicar por qué su situación cambió y qué puede hacer para mejorarla.

---

## 1. Funcionalidades

### Registro de gastos
Cada gasto debe guardar:
- fecha y hora
- monto
- moneda
- descripción
- categoría/subcategoría
- método de pago
- cuenta/tarjeta
- tipo de gasto
- necesario/prescindible
- recurrente
- fuente: web/WhatsApp
- notas

Ejemplo:
```json
{
  "type": "expense",
  "amount": 95000,
  "currency": "ARS",
  "date": "2026-08-05",
  "description": "Ropa",
  "category": "Compras",
  "subcategory": "Ropa",
  "paymentMethod": "debito",
  "expenseType": "discretionary",
  "necessary": false,
  "recurring": false,
  "source": "whatsapp"
}
```

### Registro de ingresos
Ejemplo:
```json
{
  "type": "income",
  "amount": 1700000,
  "currency": "ARS",
  "date": "2026-08-01",
  "description": "Sueldo",
  "category": "Trabajo",
  "recurring": true,
  "source": "whatsapp"
}
```

Categorías iniciales de ingresos:
- Sueldo
- Freelance
- Empresa
- Ventas
- Inversiones
- Transferencias
- Otros

### Categorías de gastos
- Vivienda: alquiler, expensas, servicios, EDET, internet, telefonía, mantenimiento
- Transporte: nafta, Uber, transporte público, reparaciones, seguro, patente
- Alimentación: supermercado, restaurantes, delivery, comida, salidas
- Compras: ropa, electrónica, hogar, accesorios
- Familia: mamá, papá, hermanos, ayuda familiar
- Finanzas: tarjeta, préstamos, deudas, comisiones
- Entretenimiento: salidas, juegos, suscripciones, eventos
- Trabajo: herramientas, software, equipamiento
- Otros

El usuario puede crear categorías.

---

## 2. Clasificación inteligente

Cada gasto se clasifica como:
- **Fijo:** alquiler, internet, seguro.
- **Variable:** supermercado, nafta, servicios.
- **Discrecional:** ropa, salidas, restaurantes.
- **Extraordinario:** reparación, repuesto, compra puntual.
- **Deuda/compromiso:** tarjeta, préstamo, deuda personal.

La clasificación puede modificarse manualmente y debe aprender de las correcciones del usuario.

---

## 3. Dashboard

Mostrar:
- ingresos del mes
- gastos del mes
- balance
- ahorro real
- porcentaje ahorrado
- presupuesto disponible
- promedio diario/semanal
- principales categorías
- gastos extraordinarios
- proyección de cierre

Ejemplo:

```text
AGOSTO 2026

Ingresos       $3.200.000
Gastos         $2.463.501
Balance          $736.499

Ahorro objetivo $900.000
Ahorro real      $500.000

Disponible       $736.499
```

Secciones:
1. Dashboard
2. Movimientos
3. Presupuestos
4. Categorías
5. Cuentas
6. Objetivos
7. Análisis IA
8. WhatsApp
9. Configuración

---

## 4. Análisis con IA

Primero calcular métricas con código y después utilizar IA para explicarlas.

Métricas:
```text
totalIncome
totalExpenses
balance
savingsRate
averageDailyExpense
averageWeeklyExpense
fixedExpenses
variableExpenses
discretionaryExpenses
extraordinaryExpenses
topCategories
topTransactions
projectedEndBalance
```

Ejemplos de análisis:
> Este mes gastaste $2.463.501. El 52% de tus ingresos se gastó durante los primeros 4 días.

> Tus principales gastos fueron EDET mamá ($336.940), comida Ailen ($320.000) y tarjeta ($250.000).

> Detectamos $640.000 en gastos potencialmente prescindibles.

> Si los gastos extraordinarios no se repiten el próximo mes, tu capacidad de ahorro podría aumentar considerablemente.

La IA debe explicar, no inventar cálculos. Los números financieros críticos deben provenir del backend.

---

## 5. Gastos prescindibles

Detectar gastos que podrían reducirse o eliminarse.

Ejemplo:
```text
Comida Ailen    $320.000
Ropa             $95.000
Pintura           $70.000
Parrilla          $55.000
```

No afirmar que un gasto es innecesario. Usar frases como:
> Este gasto podría ser prescindible según tus hábitos.

El usuario puede marcar:
- necesario
- prescindible
- no estoy seguro

---

## 6. Gastos extraordinarios y anomalías

Comparar con el historial.

Detectar:
- gastos muy superiores al promedio
- compras duplicadas
- gastos repetidos
- aumentos repentinos
- categorías que crecen demasiado

Ejemplo:
> Normalmente gastás entre $50.000 y $90.000 en ropa. Este mes gastaste $250.000.

---

## 7. Presupuesto y proyección

El usuario puede definir:
```text
Ingresos esperados: $3.200.000
Gastos fijos:       $800.000
Ahorro objetivo:    $900.000
Presupuesto variable: resto disponible
```

Calcular:
- dinero disponible
- días restantes
- gasto diario promedio
- gasto diario recomendado
- gasto esperado
- saldo proyectado a fin de mes

Ejemplo:
> Al ritmo actual podrías quedarte sin dinero antes del 25 de agosto.

---

## 8. Recomendación de ahorro

No usar solamente una regla fija del 20%.

Considerar:
- ingresos
- gastos fijos
- variables
- extraordinarios
- deudas
- historial
- objetivos
- margen de seguridad

Ejemplo:
```text
Ingresos promedio: $3.200.000
Gastos normales: $1.200.000
Gastos extraordinarios: $300.000

Ahorro recomendado: $900.000
```

---

## 9. Objetivos financieros

Permitir:
```text
Objetivo: Comprar PC
Objetivo: $2.500.000
Ahorrado: $900.000
Faltan: $1.600.000
Fecha objetivo: Diciembre 2026
```

Calcular cuánto ahorrar por mes para alcanzar el objetivo.

---

# 10. WhatsApp

Debe utilizar la **WhatsApp Cloud API** mediante webhook.

Arquitectura:
```text
Usuario
  ↓
WhatsApp
  ↓
WhatsApp Cloud API
  ↓
Webhook
  ↓
Backend
  ↓
IA / Parser financiero
  ↓
Validación
  ↓
Convex
  ↓
Respuesta WhatsApp
```

### Registrar gastos

Usuario:
```text
Gasté 15000 en supermercado
```

Respuesta:
```text
✅ Gasto registrado

Supermercado
$15.000

Categoría: Alimentación
Tipo: Variable

Balance del mes: $1.245.000
```

### Registrar ingresos

```text
Cobré 1700000 de sueldo
```

Respuesta:
```text
✅ Ingreso registrado

Sueldo
+$1.700.000

Ingresos del mes: $3.200.000
```

### Lenguaje natural

Soportar:
```text
Ayer gasté 20 lucas en una cena
Pagué 150 mil de la tarjeta
Me entraron 400k por un proyecto
Le di 50 mil a mamá
```

Si faltan datos, preguntar.

Si el modelo tiene baja confianza, pedir confirmación.

---

## 11. Consultas por WhatsApp

Permitir:
```text
¿Cuánto gasté este mes?
¿En qué gasté más?
¿Cuánto me queda?
¿Puedo gastar 100 mil hoy?
¿Cuánto debería ahorrar?
¿Cuánto gasté en comida?
¿Qué gastos puedo eliminar?
¿Cómo voy este mes?
```

La respuesta debe utilizar datos reales del usuario.

---

## 12. Alertas por WhatsApp

Ejemplos:
```text
⚠️ Ya utilizaste el 80% de tu presupuesto de entretenimiento.

Te quedan $40.000 para el resto del mes.
```

```text
💰 Vas muy bien.

Este mes ya ahorraste $700.000.
Estás a $200.000 de tu objetivo mensual.
```

---

## 13. Parser financiero con IA

Entrada:
```text
Ayer gasté 25 lucas en una cena con amigos
```

Salida estructurada:
```json
{
  "intent": "create_transaction",
  "type": "expense",
  "amount": 25000,
  "currency": "ARS",
  "date": "2026-08-09",
  "description": "Cena con amigos",
  "category": "Alimentación",
  "subcategory": "Restaurante",
  "expenseType": "discretionary",
  "confidence": 0.96
}
```

Si `confidence < 0.85`, pedir confirmación.

Intenciones mínimas:
```text
create_expense
create_income
update_transaction
delete_transaction
query_balance
query_expenses
query_income
query_category
query_month_analysis
query_savings
query_budget
query_goals
help
```

---

## 14. Base de datos

### users
```text
id
clerkId
name
email
currency
createdAt
```

### transactions
```text
id
userId
type
amount
currency
description
categoryId
subcategoryId
date
paymentMethod
accountId
expenseType
necessary
recurring
source
notes
createdAt
updatedAt
```

### categories
```text
id
userId
name
type
parentId
```

### accounts
```text
id
userId
name
type
balance
currency
```

Tipos:
- efectivo
- banco
- débito
- crédito
- billetera virtual

### budgets
```text
id
userId
month
year
categoryId
amount
```

### financial_goals
```text
id
userId
name
targetAmount
currentAmount
targetDate
```

### recurring_transactions
```text
id
userId
type
amount
description
categoryId
frequency
nextDate
active
```

### whatsapp_connections
```text
id
userId
phoneNumber
provider
externalId
active
```

### ai_analysis
```text
id
userId
period
analysis
recommendations
createdAt
```

---

## 15. Stack recomendado

```text
Frontend:
Next.js
React
TypeScript
Tailwind CSS
Recharts

Backend:
Next.js
Convex

Auth:
Clerk

IA:
OpenAI API

WhatsApp:
WhatsApp Cloud API

Hosting:
Vercel

Database:
Convex
```

Diseñar desde el principio como multiusuario y preparado para multi-tenant.

---

## 16. Seguridad

Implementar:
- autenticación
- autorización por usuario
- aislamiento de datos
- validación de webhooks
- rate limiting
- logs
- protección contra prompt injection
- validación de montos
- idempotencia de mensajes de WhatsApp

Nunca permitir que la IA acceda a datos de otro usuario.

---

## 17. Gráficos

Implementar:
- gastos por categoría
- ingresos vs gastos mensuales
- gastos diarios
- presupuesto vs consumo
- gastos recurrentes
- gastos extraordinarios
- evolución del ahorro

---

## 18. Comparación entre meses

Ejemplo:
```text
Julio vs Agosto

Alimentación       +18%
Transporte          -5%
Entretenimiento    +42%
Extraordinarios   +250%
```

La IA debe explicar los cambios.

---

## 19. MVP

### Fase 1
- Login
- Dashboard
- CRUD de gastos/ingresos
- Categorías
- Historial
- Balance
- Gráficos básicos

### Fase 2
- IA
- Análisis automático
- Presupuestos
- Objetivos
- Recurrentes
- Predicción

### Fase 3
- WhatsApp Cloud API
- Registro por lenguaje natural
- Consultas por WhatsApp
- Alertas

### Fase 4
- Análisis histórico avanzado
- Anomalías
- Recomendaciones personalizadas
- Aprendizaje de preferencias

---

## 20. Roadmap de 6 semanas

### Semana 1
- Next.js
- Convex
- Clerk
- modelo de datos
- autenticación

### Semana 2
- CRUD de movimientos
- categorías
- cuentas
- dashboard

### Semana 3
- presupuestos
- objetivos
- gráficos
- cálculos financieros

### Semana 4
- integración IA
- parser de lenguaje natural
- recomendaciones

### Semana 5
- WhatsApp Cloud API
- webhook
- registro por WhatsApp

### Semana 6
- consultas por WhatsApp
- alertas
- predicciones
- testing
- deploy

---

## 21. Primer flujo funcional

```text
Usuario:
"Gasté 25 mil en supermercado"

        ↓

IA

        ↓

Gasto
$25.000
Supermercado
Alimentación
Variable
Hoy

        ↓

Convex

        ↓

Dashboard actualizado

        ↓

WhatsApp:
"✅ Registré $25.000 de supermercado.
Este mes llevás gastados $485.000."
```

Consulta:
```text
Usuario:
¿En qué gasté más este mes?

        ↓

Backend calcula métricas

        ↓

IA explica

        ↓

WhatsApp:
"Este mes gastaste más en:

🍔 Alimentación: $420.000
🏠 Vivienda: $350.000
🚗 Transporte: $180.000

Detecté $250.000 de gastos extraordinarios.

Si no se repiten, tu próximo mes podría cerrar
con aproximadamente $250.000 más de ahorro."
```

---

## 22. Principio fundamental

El producto no debe ser solamente un gestor de gastos.

Debe ayudar a que el usuario:
1. registre
2. entienda
3. analice
4. decida
5. ahorre
6. anticipe problemas

La métrica principal no debería ser la cantidad de movimientos registrados, sino la mejora financiera del usuario:

- ahorro mensual
- variación del ahorro
- cumplimiento del presupuesto
- reducción de gastos prescindibles
- cumplimiento de objetivos
- evolución del patrimonio

---

## 23. Resultado esperado del MVP

El usuario debe poder:

1. Crear una cuenta.
2. Registrar ingresos y gastos.
3. Ver su situación financiera.
4. Conectar WhatsApp.
5. Registrar movimientos desde WhatsApp.
6. Consultar sus finanzas desde WhatsApp.
7. Recibir análisis automático.
8. Definir objetivos.
9. Recibir recomendaciones.
10. Saber cuánto puede gastar sin comprometer su ahorro.
