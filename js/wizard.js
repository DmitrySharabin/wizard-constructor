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
})();
