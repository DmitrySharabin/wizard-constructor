"use strict";

(async () => {
	Mavo.Plugins.register("wizard", {
		hooks: {
			"node-render-end": env => {
				if (env.context.property === "only") {
					// Поскольку мы не сохраняем значения промежуточных свойств,
					// из которых собирается свойство only, при загрузке данных
					// нужно выполнить обратную операцию, чтобы отразить в интерфейсе
					// заданные при формировании пошаговой инструкции параметры об использовании КОИБ.
					if (env.data) {
						const koib = env.data["use_koib"];
						let ret;

						if (Array.isArray(koib)) {
							ret = {
								mode: "custom",
								koib
							};
						} else {
							ret = {
								mode: koib
							};
						}

						env.context.mavo.root.render(ret);
					}
				}
			},

			"node-getdata-end": env => {
				if (env.context.property === "only") {
					// Если свойство only имеет в качестве значения пустую строку,
					// его не нужно сохранять. Для этого достаточно сообщить Mavo,
					// что значение этого свойства null. Всё остальное Mavo сделает самостоятельно.
					if (!env.data) {
						env.data = null;
					}
				}
			}
		}
	});

	await Mavo.inited;

	$(".mv-bar a[download$='.json']").addEventListener("mousedown", evt => {
		// Так как полностью описать ворфлоу средствами Mavo без JS невозможно,
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
			workflow.forEach(step => {
				const [from, ...flow] = step.res;

				$.extend(ret, { [from]: flow });
			});

			// И добавляем поле форкфлоу к данным для последующего сохранения
			$.extend(data, { workflow: ret });
		}

		// А так осуществляется непосредственное сохранение файла с данными
		evt.target.href =
			"data:application/json;charset=UTF-8," +
			encodeURIComponent(Mavo.safeToJSON(data));
	});
})();
