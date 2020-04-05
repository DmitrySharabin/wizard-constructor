"use strict";

(async () => {
	Mavo.Plugins.register("wizard", {
		hooks: {
			"render-start": (env) => {
				if (env.context.id === "wizardConstructor") {
					if (env.data) {
						if (env.data.only) {
							// Поскольку мы не сохраняем значения промежуточных свойств,
							// из которых собирается свойство only, при загрузке данных
							// нужно выполнить обратную операцию, чтобы отразить в интерфейсе
							// заданные при формировании пошаговой инструкции параметры об использовании КОИБ.
							const koib = env.data.only["use_koib"];
							let ret;

							if (Array.isArray(koib)) {
								ret = {
									mode: "custom",
									koib,
								};
							} else {
								ret = {
									mode: koib,
								};
							}

							$.extend(env.data, ret);
						}

						if (env.data.workflow) {
							const data = env.data.workflow;

							// Преобразуем данные к структуре, соответствующей структуре данных приложения.
							// Она отличается от той структуры, что принимает ИРБ.
							// Поэтому приходится вот так выкручиваться.
							const workflow = [];

							for (const prop in data) {
								// Один шаг в воркфлоу
								const ret = {
									from: prop,
								};

								// Описание переходов внутри шага
								const flow = [];

								data[prop].forEach((step) => {
									const res = {};

									// Определяем, на шаг или задачу устанавливается переход,
									// и активируем соответствующий пункт списка (от него зависит интерфейс приложения)
									res.goto = step.to ? "step" : "task";

									// Остальные данные просто переносим — они уже имеют правильную структуру
									$.extend(res, step);

									// Переход полностью описан. Добавляем его к остальным переходам внутри одного шага
									flow.push(res);
								});

								// Добавляем весь набор переходов в соответствующее поле
								ret.flow = [...flow];

								// Шаг полностью описан. Добавляем его к остальным шагам
								workflow.push(ret);
							}

							// Подменяем исходные данные преобразованными
							$.extend(env.data, { workflow });
						}
					}
				}
			},

			"node-getdata-end": (env) => {
				if (env.context.property === "only") {
					// Если свойство only имеет в качестве значения пустую строку,
					// его не нужно сохранять. Для этого достаточно сообщить Mavo,
					// что значение этого свойства null. Всё остальное Mavo сделает самостоятельно.
					if (!env.data) {
						env.data = null;
					}
				}
			},
		},
	});

	await Mavo.inited;

	$(".mv-bar a[download$='.json']").addEventListener("mousedown", (evt) => {
		// Так как полностью описать воркфлоу средствами Mavo без JS невозможно,
		// внесём нужные изменения в JSON-файл на этапе его выгрузки

		// Получаем все данные из приложения
		const data = Mavo.all["wizardConstructor"].getData();
		const workflow = data.workflow;

		// Удаляем существующий воркфлоу (предварительно сохранив его для последующей обработки),
		// т. к. тот формат, что сгенерирован Mavo, не понимает ИРБ
		delete data["workflow"];

		if (workflow.length) {
			const ret = {};

			// Если есть, с чем работать, просто приводим данные к виду, принимаемому ИРБ
			workflow.forEach((step) => {
				const [from, ...flow] = step.res;

				$.extend(ret, { [from]: flow });
			});

			// И добавляем поле воркфлоу к данным для последующего сохранения
			$.extend(data, { workflow: ret });
		}

		// А так осуществляется непосредственное сохранение файла с данными
		evt.target.href =
			"data:application/json;charset=UTF-8," +
			encodeURIComponent(Mavo.safeToJSON(data));
	});

	$(".mv-bar button.new-file").addEventListener("click", (evt) => {
		localStorage.removeItem("wizardConstructor");
		location.reload();
	});
})();
