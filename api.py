import requests, json

class SFCrimes(object):
	'''
		Data is taken from San-Francisco public data API (https://data.sfgov.org/)

		Data based on San-Francisco Police Department incident reports 
		(https://data.sfgov.org/Public-Safety/SFPD-Incidents-from-1-January-2003/tmnf-yvry)
	'''
	__api_path = 'https://data.sfgov.org/resource/9v2m-8wqu.json'


	@staticmethod
	def get_filtered_data(**kwargs):
		'''
			Sends http-request for data to the API
		'''
		query_params = {
			'$select':'count(*),pddistrict,category,resolution',
			'$group': 'pddistrict,category,resolution'
		}

		conditions = []
		
		if 'start_date' in kwargs:
			condition.append("date>'{}'" % kwargs[start_date])

		if 'end_date' in kwargs:
			condition.append("date<'{}'" % kwargs[end_date])

		if len(conditions) != 0 :
			query_params['$where'] = ' and '.join(conditions)

			data = requests.get(SFCrimes.__api_path, params=query_params).text
		else :
			data = requests.get(SFCrimes.__api_path, params=query_params).text
		
		data = json.loads('{"data":'+data+'}')

		result = {"name":"SanFrancisco crimes","children": SFCrimes.process_data(data['data'], query_params['$group'].split(','))}
		 
		return result


	@staticmethod
	def __factory(field_name):
		''' helper wrapper function, that generates function which reduces each element by key,
			specified in `field_name` parameter	 
		'''
		def func(prev, current):

			field = current[field_name] if field_name in current else 'None'

			if not (field in prev):
				prev[field] = {"total":0, "items": []}
			
			prev[field]['items'].append(current)
			prev[field]['total'] += int(current['count'])

			return prev

		return func


	@staticmethod
	def process_data(data, fields):
		''' Builds a nested tree of children for each element of `data`
			by performing aggregation using fields provided in `fields` parameter

			@param {list} data
			@param {list} fields - list of aggregation fields
		'''
		if len(fields) > 0:
			field = fields[0]

			# performs aggregation by key and computes total amount of aggregated rows
			final_data = reduce(SFCrimes.__factory(field), data, {})

			children_data = sorted([{"name" : k, "value": v['total']} for k,v in final_data.iteritems()], lambda a,b: b['value']-a['value'])
			
			# takes top-4 elements
			children = children_data[:4]
			# sums up another value
			total_rest_children_data = {"name":'Other', "value": reduce( lambda prev, current: prev+current['value'], children_data[4:], 0)}

			for child in children:
				name = child['name']
				# retrieves children for each of the element to build a nested tree
				child['children'] = SFCrimes.process_data(final_data[name]['items'], fields[1:])

			children.append(total_rest_children_data)

			return children

		else:
			return None
