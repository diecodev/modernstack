STATEMENT_PROCESSING_SYSTEM_PROMPT = """
Eres un asistente de IA altamente especializado en el procesamiento y extracción de datos de documentos financieros, específicamente extractos bancarios. Tu tarea es analizar el texto de un extracto bancario proporcionado y extraer la información relevante de cada transacción.
"""

STATEMENT_PROCESSING_HUMAN_PROMPT = """
Instrucciones Específicas:
Identifica cada transacción individual en el texto del extracto.
Para cada transacción, extrae los siguientes datos:
Valor de la transacción (transaction_value):
Debe ser un valor numérico (flotante de hasta dos decimales).
Conserva el signo del valor si está explícito (por ejemplo, -50.00 para un egreso) o infiérelo si el extracto distingue entre cargos y abonos. Si el valor aparece sin signo pero es claramente un egreso (ej. "Compra", "Retiro", "Pago"), asegúrate de que sea negativo. Si es un ingreso (ej. "Depósito", "Transferencia recibida", "Nómina"), asegúrate de que sea positivo.
Elimina cualquier símbolo de moneda (ej., $, EUR, COP) del valor numérico final.
Descripción (description):
El texto que describe la transacción (concepto, comercio, referencia).
Si no se encuentra una descripción explícita para una transacción, utiliza null o una cadena vacía ("") para este campo.
Fecha (date):
La fecha en que se registró o procesó la transacción.
Intenta estandarizar el formato de fecha a AAAA-MM-DD. Si el formato original es diferente (ej. DD/MM/AAAA o Mes DD, AAAA), conviértelo. Si no puedes determinar el año, usa el año más probable basado en el contexto del extracto o déjalo como está si es la única opción.
Tipo de transacción (transaction_type):
Si el transaction_value es negativo (menor que cero), este campo debe ser la cadena de texto "expense".
Si el transaction_value es positivo (mayor o igual a cero), este campo debe ser la cadena de texto "income".
Saldo después de la transacción (balance_after_transaction):
El saldo de la cuenta después de que la transacción fue procesada. Debe ser un valor numérico.
Formato de Salida:
La salida debe ser un objeto JSON con las siguientes claves a nivel superior:
"previous_balance": El saldo del extracto antes de la primera transacción del mes.
"current_balance": El saldo final después de la última transacción del mes.
"transactions": Un arreglo (lista) de objetos JSON.
Cada objeto JSON en el arreglo debe representar una única transacción.
Cada objeto debe contener exclusivamente las siguientes claves: "transaction_value", "description", "date", "transaction_type", y "balance_after_transaction".

En caso de que el documento no sea un extracto bancario o no se pueda procesar, la estructura de la salida debe ser la siguiente:
{{
  "previous_balance": null,
  "current_balance": null,
  "transactions": []
}}

Ejemplo de Fragmento de Extracto Bancario (Texto extraído de un archivo):
Fecha Descripción Débito Crédito Saldo
01/06/2024    PAGO NETFLIX SUSCRIPCION                   $15.99                  $1500.20
02/JUN/2024   TRANSFERENCIA A JUAN PEREZ                 $250.00                 $1250.20
03 JUN 2024   COMPRA EN SUPERMERCADO LA ESTRELLA         $75.40                  $1174.80
03/06/2024    INGRESO NOMINA                                        $1200.00     $2374.80
04-06-2024    RETIRO CAJERO BANCO X                      $100.00                 $2274.80
05.06.2024    PAGO SPOTIFY                               $10.00                  $2264.80
06.06.2024    ABONO INTERESES CUENTA                                $0.50        $2265.30
Ejemplo de Salida JSON Esperada (correspondiente al fragmento anterior):
{{
  "previous_balance": 1516.19,
  "current_balance": 2265.30,
  "transactions": [
    {{
      "transaction_value": -15.99,
      "description": "PAGO NETFLIX SUSCRIPCION",
      "date": "2024-06-01",
      "transaction_type": "expense",
      "balance_after_transaction": 1500.20
    }},
    {{
      "transaction_value": -250.00,
      "description": "TRANSFERENCIA A JUAN PEREZ",
      "date": "2024-06-02",
      "transaction_type": "expense",
      "balance_after_transaction": 1250.20
    }},
    {{
      "transaction_value": -75.40,
      "description": "COMPRA EN SUPERMERCADO LA ESTRELLA",
      "date": "2024-06-03",
      "transaction_type": "expense",
      "balance_after_transaction": 1174.80
    }},
    {{
      "transaction_value": 1200.00,
      "description": "INGRESO NOMINA",
      "date": "2024-06-03",
      "transaction_type": "income",
      "balance_after_transaction": 2374.80
    }},
    {{
      "transaction_value": -100.00,
      "description": "RETIRO CAJERO BANCO X",
      "date": "2024-06-04",
      "transaction_type": "expense",
      "balance_after_transaction": 2274.80
    }},
    {{
      "transaction_value": -10.00,
      "description": "PAGO SPOTIFY",
      "date": "2024-06-05",
      "transaction_type": "expense",
      "balance_after_transaction": 2264.80
    }},
    {{
      "transaction_value": 0.50,
      "description": "ABONO INTERESES CUENTA",
      "date": "2024-06-06",
      "transaction_type": "income",
      "balance_after_transaction": 2265.30
    }}
  ]
}}"""
